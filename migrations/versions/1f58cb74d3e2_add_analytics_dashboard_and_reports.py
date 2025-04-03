"""add_analytics_dashboard_and_reports

Revision ID: 1f58cb74d3e2
Revises: e8f247a91b56
Create Date: 2025-03-22 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1f58cb74d3e2'
down_revision = 'e8f247a91b56'
branch_labels = None
depends_on = None


def upgrade():
    # Adding new tables for analytics dashboards, widgets, and report templates
    
    # Analytics dashboard templates (pre-built)
    op.create_table('analytics_dashboard_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('role_required', sa.String(length=50), nullable=True),
        sa.Column('layout', sa.JSON(), nullable=False),
        sa.Column('widgets', sa.JSON(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_analytics_dashboard_templates_id'), 'analytics_dashboard_templates', ['id'], unique=False, schema='umt')
    
    # Report templates (pre-built)
    op.create_table('analytics_report_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('preview_image', sa.String(length=255), nullable=True),
        sa.Column('role_required', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('template_id', name='uq_analytics_report_template_id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_analytics_report_templates_id'), 'analytics_report_templates', ['id'], unique=False, schema='umt')
    
    # User dashboard preferences
    op.create_table('user_dashboard_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('dashboard_id', sa.Integer(), nullable=True),
        sa.Column('filters', sa.JSON(), nullable=True),
        sa.Column('date_range', sa.JSON(), nullable=True),
        sa.Column('refresh_interval', sa.Integer(), nullable=True),  # In minutes, NULL = manual refresh
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_user_dashboard_preferences_id'), 'user_dashboard_preferences', ['id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_user_dashboard_preferences_user_id'), 'user_dashboard_preferences', ['user_id'], unique=False, schema='umt')
    
    # Report generation history
    op.create_table('report_generation_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),  # success, failed, processing
        sa.Column('file_path', sa.String(length=255), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('file_type', sa.String(length=10), nullable=True),
        sa.Column('parameters', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['report_id'], ['umt.analytics_reports.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_report_generation_history_id'), 'report_generation_history', ['id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_report_generation_history_report_id'), 'report_generation_history', ['report_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_report_generation_history_user_id'), 'report_generation_history', ['user_id'], unique=False, schema='umt')
    
    # Machine learning prediction history
    op.create_table('prediction_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('prediction_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('target_metric', sa.String(length=50), nullable=False),
        sa.Column('predicted_value', sa.Float(), nullable=False),
        sa.Column('actual_value', sa.Float(), nullable=True),  # Populated later for verification
        sa.Column('error_margin', sa.Float(), nullable=True),  # Populated later
        sa.Column('confidence_interval_lower', sa.Float(), nullable=True),
        sa.Column('confidence_interval_upper', sa.Float(), nullable=True),
        sa.Column('parameters', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        # Removed ForeignKeyConstraint to content_metrics.content_id since it's not a primary or unique key
        sa.ForeignKeyConstraint(['model_id'], ['umt.content_prediction_models.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_prediction_history_id'), 'prediction_history', ['id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_prediction_history_content_id'), 'prediction_history', ['content_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_prediction_history_user_id'), 'prediction_history', ['user_id'], unique=False, schema='umt')
    
    # Insert some default dashboard templates
    op.execute("""
    INSERT INTO umt.analytics_dashboard_templates (name, description, category, layout, widgets)
    VALUES 
    ('Content Performance Dashboard', 'Overview of content performance metrics', 'content', 
     '{"columns": 12, "rowHeight": 50, "compactType": "vertical"}',
     '[
        {"i": "overview-views", "x": 0, "y": 0, "w": 3, "h": 2, "widget_type": "summary", "title": "Total Views", "settings": {"metric": "views", "comparison": true}},
        {"i": "overview-engagement", "x": 3, "y": 0, "w": 3, "h": 2, "widget_type": "summary", "title": "Engagement Rate", "settings": {"metric": "engagement_rate", "comparison": true}},
        {"i": "overview-conversions", "x": 6, "y": 0, "w": 3, "h": 2, "widget_type": "summary", "title": "Conversions", "settings": {"metric": "conversions", "comparison": true}},
        {"i": "overview-revenue", "x": 9, "y": 0, "w": 3, "h": 2, "widget_type": "summary", "title": "Revenue", "settings": {"metric": "revenue", "comparison": true, "format": "currency"}},
        {"i": "performance-trend", "x": 0, "y": 2, "w": 8, "h": 4, "widget_type": "lineChart", "title": "Performance Trend", "settings": {"metrics": ["views", "clicks", "conversions"], "timeframe": "daily"}},
        {"i": "top-content", "x": 8, "y": 2, "w": 4, "h": 4, "widget_type": "topContent", "title": "Top Performing Content", "settings": {"metric": "views", "limit": 5}}
      ]'
    ),
    ('Conversion Analytics Dashboard', 'Focuses on conversion funnel and attribution', 'conversion', 
     '{"columns": 12, "rowHeight": 50, "compactType": "vertical"}',
     '[
        {"i": "funnel-overview", "x": 0, "y": 0, "w": 12, "h": 4, "widget_type": "conversionFunnel", "title": "Conversion Funnel", "settings": {"stages": ["views", "clicks", "leads", "conversions"], "showPercentages": true}},
        {"i": "attribution", "x": 0, "y": 4, "w": 6, "h": 4, "widget_type": "attribution", "title": "Attribution Analysis", "settings": {"model": "last_touch"}},
        {"i": "source-breakdown", "x": 6, "y": 4, "w": 6, "h": 4, "widget_type": "pieChart", "title": "Traffic Sources", "settings": {"metric": "conversions"}}
      ]'
    ),
    ('Executive Dashboard', 'High-level metrics for executives', 'executive', 
     '{"columns": 12, "rowHeight": 50, "compactType": "vertical"}',
     '[
        {"i": "summary-views", "x": 0, "y": 0, "w": 4, "h": 2, "widget_type": "summary", "title": "Total Views", "settings": {"metric": "views", "comparison": true}},
        {"i": "summary-conversions", "x": 4, "y": 0, "w": 4, "h": 2, "widget_type": "summary", "title": "Conversions", "settings": {"metric": "conversions", "comparison": true}},
        {"i": "summary-revenue", "x": 8, "y": 0, "w": 4, "h": 2, "widget_type": "summary", "title": "Revenue", "settings": {"metric": "revenue", "comparison": true, "format": "currency"}},
        {"i": "monthly-trend", "x": 0, "y": 2, "w": 12, "h": 4, "widget_type": "lineChart", "title": "Monthly Performance", "settings": {"metrics": ["views", "conversions", "revenue"], "timeframe": "monthly"}},
        {"i": "content-type-performance", "x": 0, "y": 6, "w": 6, "h": 4, "widget_type": "barChart", "title": "Performance by Content Type", "settings": {"metric": "views", "dimension": "content_type"}},
        {"i": "platform-breakdown", "x": 6, "y": 6, "w": 6, "h": 4, "widget_type": "pieChart", "title": "Platform Breakdown", "settings": {"metric": "views", "dimension": "platform"}}
      ]'
    )
    """)
    
    # Insert some default report templates
    op.execute("""
    INSERT INTO umt.analytics_report_templates (template_id, name, description, report_type, config)
    VALUES 
    ('content_performance_report', 'Content Performance Report', 'Comprehensive analysis of content performance', 'content_performance', 
     '{
        "sections": [
          {"title": "Executive Summary", "type": "summary"},
          {"title": "Performance Metrics", "type": "metrics", "metrics": ["views", "clicks", "conversions", "revenue"]},
          {"title": "Top Performing Content", "type": "top_content", "limit": 10},
          {"title": "Performance Trends", "type": "trend", "metrics": ["views", "engagement_rate"]},
          {"title": "Recommendations", "type": "ai_recommendations"}
        ],
        "charts": ["line_chart", "bar_chart", "pie_chart"],
        "include_predictions": true
      }'
    ),
    ('conversion_funnel_report', 'Conversion Funnel Analysis', 'Detailed analysis of the conversion funnel', 'conversion_funnel', 
     '{
        "sections": [
          {"title": "Funnel Overview", "type": "funnel"},
          {"title": "Stage Breakdown", "type": "funnel_stages"},
          {"title": "Conversion Rates", "type": "conversion_rates"},
          {"title": "Attribution Analysis", "type": "attribution"},
          {"title": "Optimization Recommendations", "type": "ai_recommendations"}
        ],
        "charts": ["funnel_chart", "bar_chart", "sankey_diagram"],
        "include_comparisons": true
      }'
    ),
    ('executive_summary', 'Executive Summary', 'High-level overview for executives', 'executive_summary', 
     '{
        "sections": [
          {"title": "Key Metrics", "type": "kpi_summary"},
          {"title": "Performance Highlights", "type": "highlights"},
          {"title": "Content ROI", "type": "roi_analysis"},
          {"title": "Strategic Recommendations", "type": "ai_recommendations"}
        ],
        "charts": ["line_chart", "bar_chart"],
        "include_trends": true,
        "include_predictions": true
      }'
    )
    """)


def downgrade():
    # Drop tables in reverse order
    op.drop_table('prediction_history', schema='umt')
    op.drop_table('report_generation_history', schema='umt')
    op.drop_table('user_dashboard_preferences', schema='umt')
    op.drop_table('analytics_report_templates', schema='umt')
    op.drop_table('analytics_dashboard_templates', schema='umt')