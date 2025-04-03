"""Add UX analytics tables

Revision ID: ux_analytics_migration
Revises: db3a8f42c01c
Create Date: 2025-03-22

This migration adds UX analytics tables for tracking:
- User interactions and events
- Feature usage metrics
- AI writing assistant usage
- WebSocket performance metrics
- User journey paths
- A/B testing variants
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# Set revision identifiers, don't change if you don't know what you're doing
revision = 'ux_analytics_migration'
down_revision = 'security_enhancement_migration'  # Updated to create a proper chain
branch_labels = None
depends_on = None

SCHEMA_NAME = "umt"

def upgrade():
    # ### Add UX analytics tables ###
    
    # User Interaction Events table
    op.create_table('user_interaction_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('event_category', sa.String(length=50), nullable=False),
        sa.Column('event_action', sa.String(length=100), nullable=False),
        sa.Column('event_label', sa.String(length=255), nullable=True),
        sa.Column('element_id', sa.String(length=255), nullable=True),
        sa.Column('page_path', sa.String(length=255), nullable=True),
        sa.Column('content_id', sa.Integer(), nullable=True),
        sa.Column('value', sa.Float(), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('device_type', sa.String(length=50), nullable=True),
        sa.Column('browser', sa.String(length=50), nullable=True),
        sa.Column('os', sa.String(length=50), nullable=True),
        sa.Column('screen_size', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], [f'{SCHEMA_NAME}.users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        schema=SCHEMA_NAME
    )
    op.create_index(op.f('ix_umt_user_interaction_events_event_category'), 'user_interaction_events', ['event_category'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_user_interaction_events_event_type'), 'user_interaction_events', ['event_type'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_user_interaction_events_page_path'), 'user_interaction_events', ['page_path'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_user_interaction_events_session_id'), 'user_interaction_events', ['session_id'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_user_interaction_events_content_id'), 'user_interaction_events', ['content_id'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_user_interaction_events_created_at'), 'user_interaction_events', ['created_at'], unique=False, schema=SCHEMA_NAME)

    # Feature Usage Metrics table
    op.create_table('feature_usage_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('feature_id', sa.String(length=100), nullable=False),
        sa.Column('feature_category', sa.String(length=50), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('unique_users', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('total_uses', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('avg_duration_sec', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('completion_rate', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('error_rate', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('satisfaction_score', sa.Float(), nullable=True),
        sa.Column('variant', sa.String(length=50), nullable=True),
        sa.Column('conversion_rate', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('feature_id', 'date', name='uq_feature_usage_date'),
        schema=SCHEMA_NAME
    )
    op.create_index(op.f('ix_umt_feature_usage_metrics_feature_id'), 'feature_usage_metrics', ['feature_id'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_feature_usage_metrics_feature_category'), 'feature_usage_metrics', ['feature_category'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_feature_usage_metrics_date'), 'feature_usage_metrics', ['date'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_feature_usage_metrics_variant'), 'feature_usage_metrics', ['variant'], unique=False, schema=SCHEMA_NAME)

    # AI Assistant Usage Metrics table
    op.create_table('ai_assistant_usage_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('suggestion_type', sa.String(length=50), nullable=False),
        sa.Column('suggestions_generated', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('suggestions_viewed', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('suggestions_accepted', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('suggestions_rejected', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('suggestions_modified', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('acceptance_rate', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('avg_response_time_ms', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('avg_suggestion_length', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('variant', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema=SCHEMA_NAME
    )
    op.create_index(op.f('ix_umt_ai_assistant_usage_metrics_date'), 'ai_assistant_usage_metrics', ['date'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_ai_assistant_usage_metrics_suggestion_type'), 'ai_assistant_usage_metrics', ['suggestion_type'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_ai_assistant_usage_metrics_variant'), 'ai_assistant_usage_metrics', ['variant'], unique=False, schema=SCHEMA_NAME)

    # WebSocket Metrics table
    op.create_table('websocket_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('metric_type', sa.String(length=50), nullable=False),
        sa.Column('peak_concurrent_connections', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('avg_concurrent_connections', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('total_connections', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('connection_errors', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('messages_sent', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('messages_received', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('bytes_sent', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('bytes_received', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('avg_message_latency_ms', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('p95_message_latency_ms', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('p99_message_latency_ms', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema=SCHEMA_NAME
    )
    op.create_index(op.f('ix_umt_websocket_metrics_date'), 'websocket_metrics', ['date'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_websocket_metrics_metric_type'), 'websocket_metrics', ['metric_type'], unique=False, schema=SCHEMA_NAME)

    # User Journey Paths table
    op.create_table('user_journey_paths',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=False),
        sa.Column('path', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('entry_page', sa.String(length=255), nullable=False),
        sa.Column('exit_page', sa.String(length=255), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_duration_sec', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('entry_source', sa.String(length=100), nullable=True),
        sa.Column('device_type', sa.String(length=50), nullable=True),
        sa.Column('completed_task', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('conversion_type', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], [f'{SCHEMA_NAME}.users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        schema=SCHEMA_NAME
    )
    op.create_index(op.f('ix_umt_user_journey_paths_session_id'), 'user_journey_paths', ['session_id'], unique=False, schema=SCHEMA_NAME)
    op.create_index(op.f('ix_umt_user_journey_paths_start_time'), 'user_journey_paths', ['start_time'], unique=False, schema=SCHEMA_NAME)

    # A/B Test Variants table
    op.create_table('ab_test_variants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('test_id', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('feature_area', sa.String(length=50), nullable=False),
        sa.Column('config', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_control', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('traffic_percentage', sa.Float(), nullable=False, server_default=sa.text('50.0')),
        sa.Column('user_segment', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default=sa.text("'active'")),
        sa.Column('metrics', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('winner', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema=SCHEMA_NAME
    )
    op.create_index(op.f('ix_umt_ab_test_variants_test_id'), 'ab_test_variants', ['test_id'], unique=False, schema=SCHEMA_NAME)

def downgrade():
    # ### Drop UX analytics tables ###
    op.drop_table('ab_test_variants', schema=SCHEMA_NAME)
    op.drop_table('user_journey_paths', schema=SCHEMA_NAME)
    op.drop_table('websocket_metrics', schema=SCHEMA_NAME)
    op.drop_table('ai_assistant_usage_metrics', schema=SCHEMA_NAME)
    op.drop_table('feature_usage_metrics', schema=SCHEMA_NAME)
    op.drop_table('user_interaction_events', schema=SCHEMA_NAME)