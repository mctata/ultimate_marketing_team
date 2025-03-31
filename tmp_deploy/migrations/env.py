import logging
from logging.config import fileConfig
import os
import sys
import datetime

from sqlalchemy import engine_from_config
from sqlalchemy import pool, text
from sqlalchemy.exc import SQLAlchemyError

from alembic import context

# Setup enhanced logging
logger = logging.getLogger('alembic.migration')
# Add a file handler to log to a separate file
migration_log_file = os.path.join(os.path.dirname(__file__), 'migration_execution.log')
file_handler = logging.FileHandler(migration_log_file)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
import os
import sys

# Add project root to path if not already there (helpful for both local and Docker environments)
root_dir = os.path.dirname(os.path.dirname(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Import all models to ensure they are all loaded
from src.models import *
from src.core.database import Base
target_metadata = Base.metadata

# Set the schema
from src.core.database import SCHEMA_NAME

def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and object.schema != SCHEMA_NAME:
        return False
    return True

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=True,
        include_object=include_object,
        version_table_schema=SCHEMA_NAME
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    start_time = datetime.datetime.now()
    logger.info(f"Starting online migrations at {start_time}")
    
    try:
        connectable = engine_from_config(
            config.get_section(config.config_ini_section),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
        
        logger.info(f"Database connection established")

        with connectable.connect() as connection:
            # Create schema if it doesn't exist
            try:
                logger.info(f"Creating schema {SCHEMA_NAME} if it doesn't exist")
                connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_NAME}"))
                logger.info(f"Schema creation successful")
            except SQLAlchemyError as e:
                logger.error(f"Error creating schema: {str(e)}")
                raise
            
            context.configure(
                connection=connection, 
                target_metadata=target_metadata,
                include_schemas=True,
                include_object=include_object,
                version_table_schema=SCHEMA_NAME
            )
            
            logger.info("Alembic context configured, starting migrations")

            try:
                with context.begin_transaction():
                    context.run_migrations()
                    logger.info("Migrations completed successfully")
            except Exception as e:
                logger.error(f"Migration error: {str(e)}")
                raise
    except Exception as e:
        logger.error(f"Fatal migration error: {str(e)}")
        raise
    finally:
        end_time = datetime.datetime.now()
        duration = end_time - start_time
        logger.info(f"Migration process ended at {end_time} (duration: {duration})")


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
