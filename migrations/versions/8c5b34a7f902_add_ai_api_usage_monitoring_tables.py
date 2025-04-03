"""Add AI API usage monitoring tables

Revision ID: 8c5b34a7f902
Revises: db3a8f42c01c_add_benchmark_tables
Create Date: 2025-03-21 18:23:12.123456

This migration adds tables for tracking AI API usage and costs:
- ai_api_usage: Detailed log of each API call with cost and performance metrics
- daily_cost_summary: Daily aggregated cost metrics by provider and model
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import datetime

# revision identifiers, used by Alembic
revision = '8c5b34a7f902'
down_revision = 'db3a8f42c01c'
branch_labels = None
depends_on = None

# Get schema name from environment
schema_name = "umt"


def upgrade():
    # Create ai_api_usage table for detailed API usage tracking
    op.create_table(
        'ai_api_usage',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('model', sa.String(50), nullable=False),
        sa.Column('tokens_in', sa.Integer, nullable=False),
        sa.Column('tokens_out', sa.Integer, nullable=False),
        sa.Column('total_tokens', sa.Integer, nullable=False),
        sa.Column('duration_ms', sa.Integer, nullable=False),
        sa.Column('cost_usd', sa.Integer, nullable=False),  # Cost in cents (USD * 100)
        sa.Column('endpoint', sa.String(50), nullable=False),
        sa.Column('cached', sa.Boolean, default=False, nullable=False),
        sa.Column('success', sa.Boolean, default=True, nullable=False),
        sa.Column('error_type', sa.String(50), nullable=True),
        sa.Column('agent_type', sa.String(50), nullable=True),
        sa.Column('task_id', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime, default=datetime.utcnow, nullable=False),
        schema=schema_name
    )
    
    # Create indexes for frequent query patterns
    op.create_index(
        'idx_ai_api_usage_provider_model',
        'ai_api_usage',
        ['provider', 'model'],
        schema=schema_name
    )
    
    op.create_index(
        'idx_ai_api_usage_created_at',
        'ai_api_usage',
        ['created_at'],
        schema=schema_name
    )
    
    op.create_index(
        'idx_ai_api_usage_agent_type',
        'ai_api_usage',
        ['agent_type'],
        schema=schema_name
    )
    
    op.create_index(
        'idx_ai_api_usage_task_id',
        'ai_api_usage',
        ['task_id'],
        schema=schema_name
    )
    
    # Create daily_cost_summary table for aggregated metrics
    op.create_table(
        'daily_cost_summary',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('date', sa.DateTime, nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('model', sa.String(50), nullable=False),
        sa.Column('total_requests', sa.Integer, default=0, nullable=False),
        sa.Column('cached_requests', sa.Integer, default=0, nullable=False),
        sa.Column('failed_requests', sa.Integer, default=0, nullable=False),
        sa.Column('total_tokens', sa.Integer, default=0, nullable=False),
        sa.Column('cost_usd', sa.Integer, default=0, nullable=False),  # Cost in cents (USD * 100)
        sa.Column('updated_at', sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False),
        schema=schema_name
    )
    
    # Create indexes for summary table
    op.create_index(
        'idx_daily_cost_summary_date',
        'daily_cost_summary',
        ['date'],
        schema=schema_name
    )
    
    op.create_index(
        'idx_daily_cost_summary_provider_model',
        'daily_cost_summary',
        ['provider', 'model'],
        schema=schema_name
    )
    
    # Create unique constraint on date, provider, model
    op.create_unique_constraint(
        'uq_daily_cost_summary_date_provider_model',
        'daily_cost_summary',
        ['date', 'provider', 'model'],
        schema=schema_name
    )
    
    # Insert record in migration_history for this migration
    # Format the schema name directly in the query string since schema can't be bound as a parameter
    query = text(f"INSERT INTO {schema_name}.migration_history (version, applied_at, description, status, environment) "
                 "VALUES (:revision, :timestamp, :description, :status, :environment)")
    
    op.execute(
        query.bindparams(
            revision=revision,
            timestamp=datetime.utcnow(),
            description='Add AI API usage monitoring tables',
            status='OK',
            environment='development'
        )
    )


def downgrade():
    # Drop the tables in reverse order
    op.drop_constraint(
        'uq_daily_cost_summary_date_provider_model', 
        'daily_cost_summary',
        schema=schema_name
    )
    op.drop_index('idx_daily_cost_summary_provider_model', table_name='daily_cost_summary', schema=schema_name)
    op.drop_index('idx_daily_cost_summary_date', table_name='daily_cost_summary', schema=schema_name)
    op.drop_table('daily_cost_summary', schema=schema_name)
    
    op.drop_index('idx_ai_api_usage_task_id', table_name='ai_api_usage', schema=schema_name)
    op.drop_index('idx_ai_api_usage_agent_type', table_name='ai_api_usage', schema=schema_name)
    op.drop_index('idx_ai_api_usage_created_at', table_name='ai_api_usage', schema=schema_name)
    op.drop_index('idx_ai_api_usage_provider_model', table_name='ai_api_usage', schema=schema_name)
    op.drop_table('ai_api_usage', schema=schema_name)