"""Add SEO tables for Google Search optimization module

Revision ID: 85f2add36528
Revises: e8f247a91b56
Create Date: 2025-03-26 14:12:20.854332

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '85f2add36528'
down_revision = 'e8f247a91b56'
branch_labels = None
depends_on = None


def upgrade():
    # Create SEO audit logs table
    op.create_table(
        'seo_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('audit_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_seo_audit_logs_content_id'), 'seo_audit_logs', ['content_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_seo_audit_logs_id'), 'seo_audit_logs', ['id'], unique=False, schema='umt')
    
    # Create SEO content metrics table
    op.create_table(
        'seo_content_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('url', sa.String(length=255), nullable=True),
        sa.Column('average_position', sa.Float(), nullable=True),
        sa.Column('total_clicks', sa.Integer(), nullable=True),
        sa.Column('total_impressions', sa.Integer(), nullable=True),
        sa.Column('average_ctr', sa.Float(), nullable=True),
        sa.Column('top_keywords', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('historical_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_seo_content_metrics_content_id'), 'seo_content_metrics', ['content_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_seo_content_metrics_id'), 'seo_content_metrics', ['id'], unique=False, schema='umt')
    
    # Create SEO keyword opportunities table
    op.create_table(
        'seo_keyword_opportunities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('keyword', sa.String(length=255), nullable=False),
        sa.Column('current_ranking', sa.Integer(), nullable=True),
        sa.Column('search_volume', sa.Integer(), nullable=True),
        sa.Column('competition', sa.String(length=20), nullable=True),
        sa.Column('opportunity_score', sa.Integer(), nullable=True),
        sa.Column('recommended_action', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_seo_keyword_opportunities_content_id'), 'seo_keyword_opportunities', ['content_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_seo_keyword_opportunities_id'), 'seo_keyword_opportunities', ['id'], unique=False, schema='umt')
    
    # Create SEO content update recommendations table
    op.create_table(
        'seo_content_update_recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('recommendation_type', sa.String(length=50), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('recommendation', sa.Text(), nullable=False),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('implemented', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_seo_content_update_recommendations_content_id'), 'seo_content_update_recommendations', ['content_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_seo_content_update_recommendations_id'), 'seo_content_update_recommendations', ['id'], unique=False, schema='umt')
    
    # Create search console properties table
    op.create_table(
        'search_console_properties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('property_type', sa.String(length=50), nullable=False),
        sa.Column('property_uri', sa.String(length=255), nullable=False),
        sa.Column('verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('verification_method', sa.String(length=50), nullable=True),
        sa.Column('credentials_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_search_console_properties_brand_id'), 'search_console_properties', ['brand_id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_search_console_properties_id'), 'search_console_properties', ['id'], unique=False, schema='umt')


def downgrade():
    op.drop_index(op.f('ix_umt_search_console_properties_id'), table_name='search_console_properties', schema='umt')
    op.drop_index(op.f('ix_umt_search_console_properties_brand_id'), table_name='search_console_properties', schema='umt')
    op.drop_table('search_console_properties', schema='umt')
    
    op.drop_index(op.f('ix_umt_seo_content_update_recommendations_id'), table_name='seo_content_update_recommendations', schema='umt')
    op.drop_index(op.f('ix_umt_seo_content_update_recommendations_content_id'), table_name='seo_content_update_recommendations', schema='umt')
    op.drop_table('seo_content_update_recommendations', schema='umt')
    
    op.drop_index(op.f('ix_umt_seo_keyword_opportunities_id'), table_name='seo_keyword_opportunities', schema='umt')
    op.drop_index(op.f('ix_umt_seo_keyword_opportunities_content_id'), table_name='seo_keyword_opportunities', schema='umt')
    op.drop_table('seo_keyword_opportunities', schema='umt')
    
    op.drop_index(op.f('ix_umt_seo_content_metrics_id'), table_name='seo_content_metrics', schema='umt')
    op.drop_index(op.f('ix_umt_seo_content_metrics_content_id'), table_name='seo_content_metrics', schema='umt')
    op.drop_table('seo_content_metrics', schema='umt')
    
    op.drop_index(op.f('ix_umt_seo_audit_logs_id'), table_name='seo_audit_logs', schema='umt')
    op.drop_index(op.f('ix_umt_seo_audit_logs_content_id'), table_name='seo_audit_logs', schema='umt')
    op.drop_table('seo_audit_logs', schema='umt')