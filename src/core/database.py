from sqlalchemy import create_engine, event, exc, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
import os
import time
import logging
import traceback
from functools import wraps
from typing import Dict, Any, Optional, Callable

from src.core.settings import settings
from src.core.logging import log_slow_query

# Define schema name for all tables
SCHEMA_NAME = "umt"

# Override DATABASE_URL for Docker containers
database_url = os.environ.get("DATABASE_URL", settings.DATABASE_URL)

# Get pool size from environment with reasonable defaults
pool_size = settings.DB_POOL_SIZE
pool_timeout = settings.DB_POOL_TIMEOUT
max_overflow = settings.DB_MAX_OVERFLOW
pool_recycle = settings.DB_POOL_RECYCLE
statement_timeout = settings.DB_STATEMENT_TIMEOUT
pre_ping = True  # Enable connection testing before use

# Determine if we're in a high-memory environment
high_memory_env = os.environ.get("HIGH_MEMORY_ENVIRONMENT", "false").lower() == "true"

# Adjust pool size based on environment
if high_memory_env:
    # For high-memory environments, we can use larger pools
    pool_size = max(pool_size, 25)
    max_overflow = max(max_overflow, 50)
    logging.info(f"Using enlarged connection pool for high-memory environment: size={pool_size}, overflow={max_overflow}")

# Configure engine kwargs
engine_kwargs = {
    "poolclass": QueuePool,
    "pool_size": pool_size,
    "pool_timeout": pool_timeout,
    "pool_recycle": pool_recycle,
    "max_overflow": max_overflow,
    "pool_pre_ping": pre_ping,
    "connect_args": {
        "options": f"-c statement_timeout={statement_timeout}",  # Query timeout
        "connect_timeout": min(30, pool_timeout),  # Connection timeout
        "keepalives": 1,  # Enable TCP keepalives
        "keepalives_idle": 60,  # Idle time before sending keepalive (seconds)
        "keepalives_interval": 10,  # Interval between keepalives
        "keepalives_count": 5,  # Number of keepalives before giving up
        "application_name": "ultimatemarketing",  # Identify app in pg_stat_activity
    }
}

# Set client encoding to UTF-8 
engine_kwargs["connect_args"]["client_encoding"] = "utf8"

# For statement timeout, check DB settings
if settings.DB_STATEMENT_TIMEOUT:
    engine_kwargs["connect_args"]["options"] = f"-c statement_timeout={settings.DB_STATEMENT_TIMEOUT}"

# Create SQLAlchemy engine with optimized connection pooling
try:
    engine = create_engine(str(database_url), **engine_kwargs)
    logging.info("Database engine initialized successfully")
except Exception as e:
    logging.error(f"Error creating database engine: {str(e)}")
    # Create a dummy engine that will be replaced once DB is available
    # This allows the app to start even if DB is temporarily unavailable
    engine = None

# Add connection pool listeners
@event.listens_for(create_engine(str(database_url)), "connect")
def connect(dbapi_connection, connection_record):
    """Configure new connections with best practices."""
    try:
        # Set session parameters for this connection
        cursor = dbapi_connection.cursor()
        cursor.execute("SET TIME ZONE 'UTC';")
        cursor.execute("SET application_name TO 'ultimatemarketing';")
        cursor.close()
    except Exception as e:
        logging.error(f"Error configuring database connection: {str(e)}")

@event.listens_for(create_engine(str(database_url)), "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    """Validate connections on checkout to ensure they're still alive."""
    try:
        connection_record.info.setdefault('checkout_time', time.time())
        # Check if the connection has been waiting too long in the pool
        if settings.ENV == "production":
            checkout_age = time.time() - connection_record.info['checkout_time']
            if checkout_age > 3600:  # 1 hour
                # If the connection is too old, replace it
                connection_record.connection = connection_proxy.connection = None
                raise exc.DisconnectionError("Connection too old")
    except Exception as e:
        logging.error(f"Error during connection checkout: {str(e)}")
        raise

# Add listener for connection recycling
@event.listens_for(create_engine(str(database_url)), "checkin")
def checkin(dbapi_connection, connection_record):
    """Update connection record after checkin."""
    connection_record.info['checkout_time'] = time.time()
    connection_record.info['checkin_count'] = connection_record.info.get('checkin_count', 0) + 1

# Create session factory - use scoped_session for thread safety with advanced settings
try:
    session_factory = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,  # Don't expire objects when committing (better performance)
    )
    SessionLocal = scoped_session(session_factory)
except Exception as e:
    logging.error(f"Error creating session factory: {str(e)}")
    # Create a placeholder session factory
    SessionLocal = None

# Base class for SQLAlchemy models
Base = declarative_base()

def get_engine():
    """Get the SQLAlchemy engine.
    
    This function can be used to get the engine when needed outside of the 
    standard pattern, such as for testing or migrations.
    
    Returns:
        Engine: SQLAlchemy engine instance
    """
    global engine
    # If engine wasn't created successfully, try to recreate it now
    if engine is None:
        try:
            engine = create_engine(str(database_url), **engine_kwargs)
            logging.info("Database engine initialized successfully on retry")
        except Exception as e:
            logging.error(f"Error recreating database engine: {str(e)}")
            raise
    
    return engine

def initialize_session_factory():
    """Reinitialize session factory if it wasn't created successfully."""
    global SessionLocal, session_factory, engine
    
    if SessionLocal is None:
        try:
            if engine is None:
                engine = get_engine()
                
            session_factory = sessionmaker(
                bind=engine,
                autocommit=False,
                autoflush=False,
                expire_on_commit=False,
            )
            SessionLocal = scoped_session(session_factory)
            logging.info("Session factory initialized successfully on retry")
        except Exception as e:
            logging.error(f"Error reinitializing session factory: {str(e)}")
            raise

# Set up query performance monitoring
@event.listens_for(create_engine(str(database_url)), "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    # Store start time in context for this query
    context._query_start_time = time.time()
    # Log the query for debugging in development
    if settings.ENV == "development" and settings.LOG_LEVEL == "DEBUG":
        logging.debug(f"SQL: {statement}\nParameters: {parameters}")

@event.listens_for(create_engine(str(database_url)), "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    # Calculate query execution time
    execution_time = time.time() - context._query_start_time
    
    # Log slow queries (> 0.5 seconds)
    if execution_time > 0.5:
        log_slow_query(statement, parameters, execution_time)

# Ensure all models are loaded and SQLAlchemy knows about all the relationships
def configure_mappers():
    """
    Import all models and configure SQLAlchemy mappers.
    This function should be called before any database operation to ensure
    all relationships are properly set up.
    """
    try:
        import src.models
        from sqlalchemy.orm import configure_mappers
        configure_mappers()
        logging.debug("SQLAlchemy mappers configured successfully")
    except Exception as e:
        logging.error(f"Error configuring SQLAlchemy mappers: {str(e)}")
        if settings.ENV != "production":  # More detailed logs for non-production
            tb = traceback.format_exc()
            logging.error(f"Mapper configuration traceback: {tb}")
        raise

def retry_on_db_error(max_retries=3, retry_delay=1):
    """
    Decorator to retry database operations on specific exceptions.
    
    Args:
        max_retries: Maximum number of retry attempts
        retry_delay: Delay between retries in seconds
        
    Returns:
        Decorated function that will retry on specific database exceptions
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            last_error = None
            
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except (exc.OperationalError, exc.DisconnectionError) as e:
                    retries += 1
                    last_error = e
                    error_msg = str(e)
                    
                    # Only retry on connection errors
                    if "could not connect" in error_msg or "connection" in error_msg.lower():
                        logging.warning(f"Database connection error (attempt {retries}/{max_retries}): {error_msg}")
                        if retries < max_retries:
                            logging.info(f"Retrying in {retry_delay} seconds...")
                            time.sleep(retry_delay)
                            continue
                    
                    # For other operational errors, don't retry
                    raise
                except Exception as e:
                    # Don't retry on other exceptions
                    raise
            
            # If we get here, we've exhausted retries
            logging.error(f"Maximum retry attempts reached. Last error: {last_error}")
            raise last_error
        
        return wrapper
    
    return decorator

@contextmanager
def get_db():
    """Provides a transactional scope around a series of operations."""
    # Ensure session factory is initialized
    if SessionLocal is None:
        initialize_session_factory()
    
    # Ensure all mappers are configured before creating the session
    configure_mappers()
    
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
        # Remove session from scoped registry
        SessionLocal.remove()

def with_db_transaction(func):
    """Decorator to automatically handle database transactions."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        with get_db() as db:
            return func(db=db, *args, **kwargs)
    return wrapper

def health_check():
    """
    Perform a simple database health check.
    
    Returns:
        bool: True if database is accessible, False otherwise
    """
    try:
        with get_db() as db:
            result = db.execute(text("SELECT 1")).scalar()
            return result == 1
    except Exception as e:
        logging.error(f"Database health check failed: {str(e)}")
        return False
