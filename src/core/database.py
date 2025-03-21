from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import os

from src.core.settings import settings

# Define schema name for all tables
SCHEMA_NAME = "umt"

# Override DATABASE_URL for Docker containers
database_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/ultimatemarketing")

# Create SQLAlchemy engine
engine = create_engine(str(database_url))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
