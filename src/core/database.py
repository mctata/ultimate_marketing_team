from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
import os
import time
import logging
from functools import wraps

from src.core.settings import settings
from src.core.logging import log_slow_query

# Define schema name for all tables
SCHEMA_NAME = "umt"

# Override DATABASE_URL for Docker containers
database_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/ultimatemarketing")

# Get pool size from environment with reasonable defaults
pool_size = int(os.environ.get("DB_POOL_SIZE", "10"))
pool_timeout = int(os.environ.get("DB_POOL_TIMEOUT", "30"))
max_overflow = int(os.environ.get("DB_MAX_OVERFLOW", "20"))
pool_recycle = int(os.environ.get("DB_POOL_RECYCLE", "300"))  # 5 minutes

# Create SQLAlchemy engine with optimized connection pooling
engine = create_engine(
    str(database_url),
    poolclass=QueuePool,
    pool_size=pool_size,
    pool_timeout=pool_timeout,
    pool_recycle=pool_recycle,
    max_overflow=max_overflow,
    connect_args={"options": "-c statement_timeout=30000"}  # 30 second query timeout
)

# Create session factory - use scoped_session for thread safety
session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = scoped_session(session_factory)

# Base class for SQLAlchemy models
Base = declarative_base()

def get_engine():
    """Get the SQLAlchemy engine.
    
    This function can be used to get the engine when needed outside of the 
    standard pattern, such as for testing or migrations.
    
    Returns:
        Engine: SQLAlchemy engine instance
    """
    return engine

# Set up query performance monitoring
@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    # Store start time in context for this query
    context._query_start_time = time.time()
    # Log the query for debugging in development
    if settings.ENV == "development" and settings.LOG_LEVEL == "DEBUG":
        logging.debug(f"SQL: {statement}\nParameters: {parameters}")

@event.listens_for(engine, "after_cursor_execute")
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
    import src.models
    from sqlalchemy.orm import configure_mappers
    configure_mappers()

@contextmanager
def get_db():
    """Provides a transactional scope around a series of operations."""
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
