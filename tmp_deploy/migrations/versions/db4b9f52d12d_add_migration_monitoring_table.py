"""Add migration monitoring table

Revision ID: db3a8f42c01c
Revises: 085ea2682734
Create Date: 2025-03-21 15:48:12.123456

This migration adds a migration_history table to track migration operations,
making it easier to monitor the state of migrations in production environments.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import datetime

# revision identifiers, used by Alembic
revision = 'db4b9f52d12d'
down_revision = '085ea2682734'
branch_labels = None
depends_on = None

# Get schema name from environment
schema_name = "umt"


def upgrade():
    # Create migration_history table
    op.create_table(
        'migration_history',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('version', sa.String(40), nullable=False),
        sa.Column('applied_at', sa.DateTime, default=datetime.utcnow, nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('duration_ms', sa.Integer, nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('user', sa.String(100), nullable=True),
        sa.Column('environment', sa.String(50), nullable=True),
        schema=schema_name
    )
    
    # Create index on version for faster lookups
    op.create_index(
        'idx_migration_history_version', 
        'migration_history',
        ['version'], 
        schema=schema_name
    )
    
    # Create index on applied_at for faster chronological queries
    op.create_index(
        'idx_migration_history_applied_at', 
        'migration_history',
        ['applied_at'], 
        schema=schema_name
    )
    
    # We would typically register our own migration, but we're creating the table now
    # so it's redundant.
    # query = text(f"INSERT INTO {schema_name}.migration_history (version, applied_at, description, status, environment) "
    #             "VALUES (:revision, :timestamp, :description, :status, :environment)")
    # 
    # op.execute(
    #     query.bindparams(
    #         revision=revision,
    #         timestamp=datetime.utcnow(),
    #         description='Add migration monitoring table',
    #         status='OK',
    #         environment='development'
    #     )
    # )


def downgrade():
    # Drop the migration_history table
    op.drop_index('idx_migration_history_applied_at', table_name='migration_history', schema=schema_name)
    op.drop_index('idx_migration_history_version', table_name='migration_history', schema=schema_name)
    op.drop_table('migration_history', schema=schema_name)