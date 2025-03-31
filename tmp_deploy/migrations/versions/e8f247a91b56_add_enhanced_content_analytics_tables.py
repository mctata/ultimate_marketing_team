"""add_enhanced_content_analytics_tables

Revision ID: e8f247a91b56
Revises: 8c5b34a7f902
Create Date: 2025-03-22 09:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e8f247a91b56'
down_revision = '8c5b34a7f902'
branch_labels = None
depends_on = None


def upgrade():
    # Create content_metrics table
    op.create_table('content_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('platform', sa.String(length=50), nullable=False),
        sa.Column('views', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('unique_visitors', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('likes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('shares', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comments', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('clicks', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('click_through_rate', sa.Float(), nullable=False, server_default='0'),
        sa.Column('avg_time_on_page', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('bounce_rate', sa.Float(), nullable=False, server_default='0'),
        sa.Column('scroll_depth', sa.Float(), nullable=False, server_default='0'),
        sa.Column('conversions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('conversion_rate', sa.Float(), nullable=False, server_default='0'),
        sa.Column('leads_generated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('revenue_generated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('serp_position', sa.Float(), nullable=True),
        sa.Column('organic_traffic', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('backlinks', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('demographics', sa.JSON(), nullable=True),
        sa.Column('sources', sa.JSON(), nullable=True),
        sa.Column('devices', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('content_id', 'date', 'platform', name='uq_content_metric_content_date_platform'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_content_metrics_content_id'), 'content_metrics', ['content_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_content_metrics_date'), 'content_metrics', ['date'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_content_metrics_id'), 'content_metrics', ['id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_content_metrics_platform'), 'content_metrics', ['platform'], unique=False, schema='umt')

    # Create content_attribution_paths table
    op.create_table('content_attribution_paths',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_identifier', sa.String(length=255), nullable=False),
        sa.Column('conversion_id', sa.String(length=255), nullable=False),
        sa.Column('conversion_type', sa.String(length=50), nullable=False),
        sa.Column('conversion_value', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('path', sa.JSON(), nullable=False),
        sa.Column('first_touch_content_id', sa.Integer(), nullable=True),
        sa.Column('last_touch_content_id', sa.Integer(), nullable=True),
        sa.Column('conversion_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_content_attribution_paths_conversion_date'), 'content_attribution_paths', ['conversion_date'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_content_attribution_paths_conversion_id'), 'content_attribution_paths', ['conversion_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_content_attribution_paths_first_touch_content_id'), 'content_attribution_paths', ['first_touch_content_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_content_attribution_paths_id'), 'content_attribution_paths', ['id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_content_attribution_paths_last_touch_content_id'), 'content_attribution_paths', ['last_touch_content_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_content_attribution_paths_user_identifier'), 'content_attribution_paths', ['user_identifier'], unique=False, schema='umt')

    # Create custom_dashboards table
    op.create_table('custom_dashboards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('layout', sa.JSON(), nullable=False),
        sa.Column('widgets', sa.JSON(), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['role_id'], ['umt.roles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_custom_dashboards_id'), 'custom_dashboards', ['id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_custom_dashboards_user_id'), 'custom_dashboards', ['user_id'], unique=False, schema='umt')

    # Create analytics_reports table
    op.create_table('analytics_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('template_id', sa.String(length=100), nullable=True),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('schedule_type', sa.String(length=50), nullable=True),
        sa.Column('schedule_config', sa.JSON(), nullable=True),
        sa.Column('recipients', sa.JSON(), nullable=True),
        sa.Column('last_generated', sa.DateTime(timezone=True), nullable=True),
        sa.Column('file_path', sa.String(length=255), nullable=True),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_analytics_reports_created_by'), 'analytics_reports', ['created_by'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_analytics_reports_id'), 'analytics_reports', ['id'], unique=False, schema='umt')

    # Create content_prediction_models table
    op.create_table('content_prediction_models',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('model_type', sa.String(length=50), nullable=False),
        sa.Column('target_metric', sa.String(length=50), nullable=False),
        sa.Column('features', sa.JSON(), nullable=False),
        sa.Column('model_path', sa.String(length=255), nullable=False),
        sa.Column('performance_metrics', sa.JSON(), nullable=False),
        sa.Column('training_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_used', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_content_prediction_models_id'), 'content_prediction_models', ['id'], unique=False, schema='umt')

    # Create content_performance_predictions table
    op.create_table('content_performance_predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('prediction_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('metric', sa.String(length=50), nullable=False),
        sa.Column('predicted_value', sa.Float(), nullable=False),
        sa.Column('confidence_interval_lower', sa.Float(), nullable=True),
        sa.Column('confidence_interval_upper', sa.Float(), nullable=True),
        sa.Column('features_used', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['model_id'], ['umt.content_prediction_models.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_content_performance_predictions_content_id'), 'content_performance_predictions', ['content_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_content_performance_predictions_id'), 'content_performance_predictions', ['id'], unique=False, schema='umt')


def downgrade():
    # Drop all tables in reverse order
    op.drop_table('content_performance_predictions', schema='umt')
    op.drop_table('content_prediction_models', schema='umt')
    op.drop_table('analytics_reports', schema='umt')
    op.drop_table('custom_dashboards', schema='umt')
    op.drop_table('content_attribution_paths', schema='umt')
    op.drop_table('content_metrics', schema='umt')