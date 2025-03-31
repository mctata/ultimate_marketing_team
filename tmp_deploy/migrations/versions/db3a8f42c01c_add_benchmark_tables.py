"""add benchmark tables

Revision ID: db3a8f42c01c
Revises: 085ea2682734
Create Date: 2025-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'db3a8f42c01c'
down_revision = '085ea2682734'
branch_labels = None
depends_on = None


def upgrade():
    # Create BenchmarkRun table
    op.create_table(
        'benchmark_runs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.String(length=50), nullable=False),
        sa.Column('app_version', sa.String(length=50), nullable=False),
        sa.Column('environment', sa.String(length=20), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('git_commit', sa.String(length=40), nullable=True),
        sa.Column('git_branch', sa.String(length=100), nullable=True),
        sa.Column('test_type', sa.String(length=50), nullable=False),
        sa.Column('parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('summary_metrics', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='running'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('run_id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_benchmark_runs_app_version'), 'benchmark_runs', ['app_version'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_benchmark_runs_start_time'), 'benchmark_runs', ['start_time'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_benchmark_runs_test_type'), 'benchmark_runs', ['test_type'], unique=False, schema='umt')

    # Create APIMetric table
    op.create_table(
        'benchmark_api_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('benchmark_run_id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('endpoint', sa.String(length=255), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('response_time_ms', sa.Float(), nullable=False),
        sa.Column('request_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('error_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('min_response_time_ms', sa.Float(), nullable=True),
        sa.Column('max_response_time_ms', sa.Float(), nullable=True),
        sa.Column('avg_response_time_ms', sa.Float(), nullable=True),
        sa.Column('median_response_time_ms', sa.Float(), nullable=True),
        sa.Column('p90_response_time_ms', sa.Float(), nullable=True),
        sa.Column('p95_response_time_ms', sa.Float(), nullable=True),
        sa.Column('p99_response_time_ms', sa.Float(), nullable=True),
        sa.Column('request_size_bytes', sa.Integer(), nullable=True),
        sa.Column('response_size_bytes', sa.Integer(), nullable=True),
        sa.Column('context', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['benchmark_run_id'], ['umt.benchmark_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_benchmark_api_metrics_benchmark_run_id'), 'benchmark_api_metrics', ['benchmark_run_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_benchmark_api_metrics_endpoint'), 'benchmark_api_metrics', ['endpoint'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_benchmark_api_metrics_timestamp'), 'benchmark_api_metrics', ['timestamp'], unique=False, schema='umt')

    # Create ResourceMetric table
    op.create_table(
        'benchmark_resource_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('benchmark_run_id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('service', sa.String(length=50), nullable=False),
        sa.Column('instance_id', sa.String(length=50), nullable=True),
        sa.Column('cpu_usage_percent', sa.Float(), nullable=True),
        sa.Column('memory_usage_mb', sa.Float(), nullable=True),
        sa.Column('memory_usage_percent', sa.Float(), nullable=True),
        sa.Column('disk_read_bytes', sa.Integer(), nullable=True),
        sa.Column('disk_write_bytes', sa.Integer(), nullable=True),
        sa.Column('network_in_bytes', sa.Integer(), nullable=True),
        sa.Column('network_out_bytes', sa.Integer(), nullable=True),
        sa.Column('open_file_descriptors', sa.Integer(), nullable=True),
        sa.Column('thread_count', sa.Integer(), nullable=True),
        sa.Column('process_count', sa.Integer(), nullable=True),
        sa.Column('context', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['benchmark_run_id'], ['umt.benchmark_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_benchmark_resource_metrics_benchmark_run_id'), 'benchmark_resource_metrics', ['benchmark_run_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_benchmark_resource_metrics_service'), 'benchmark_resource_metrics', ['service'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_benchmark_resource_metrics_timestamp'), 'benchmark_resource_metrics', ['timestamp'], unique=False, schema='umt')

    # Create QueueMetric table
    op.create_table(
        'benchmark_queue_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('benchmark_run_id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('queue_name', sa.String(length=100), nullable=False),
        sa.Column('service', sa.String(length=50), nullable=False),
        sa.Column('queue_length', sa.Integer(), nullable=True),
        sa.Column('processing_time_ms', sa.Float(), nullable=True),
        sa.Column('messages_published', sa.Integer(), nullable=True),
        sa.Column('messages_consumed', sa.Integer(), nullable=True),
        sa.Column('error_count', sa.Integer(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('oldest_message_age_sec', sa.Float(), nullable=True),
        sa.Column('context', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['benchmark_run_id'], ['umt.benchmark_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_benchmark_queue_metrics_benchmark_run_id'), 'benchmark_queue_metrics', ['benchmark_run_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_benchmark_queue_metrics_queue_name'), 'benchmark_queue_metrics', ['queue_name'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_benchmark_queue_metrics_timestamp'), 'benchmark_queue_metrics', ['timestamp'], unique=False, schema='umt')


def downgrade():
    op.drop_table('benchmark_queue_metrics', schema='umt')
    op.drop_table('benchmark_resource_metrics', schema='umt')
    op.drop_table('benchmark_api_metrics', schema='umt')
    op.drop_table('benchmark_runs', schema='umt')