"""Initial database schema

Revision ID: c16d574b5146
Revises: 
Create Date: 2025-03-21 11:40:16.618144

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = 'c16d574b5146'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create schema
    op.execute(text('CREATE SCHEMA IF NOT EXISTS umt'))
    
    # Create tables in the 'umt' schema
    # Users
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
        schema='umt'
    )
    
    # Brands
    op.create_table('brands',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(length=255), nullable=True),
        sa.Column('color_primary', sa.String(length=20), nullable=True),
        sa.Column('color_secondary', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    
    # Projects
    op.create_table('project_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        schema='umt'
    )
    
    op.create_table('projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('project_type_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['brand_id'], ['umt.brands.id'], ),
        sa.ForeignKeyConstraint(['project_type_id'], ['umt.project_types.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    
    # Content
    op.create_table('content',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('publish_date', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['umt.projects.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    
    # Content Drafts
    op.create_table('content_drafts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.Integer(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['content_id'], ['umt.content.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('content_id', 'version', name='uq_content_draft_version'),
        schema='umt'
    )
    
    # Social Accounts
    op.create_table('social_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=50), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('access_token', sa.String(length=255), nullable=True),
        sa.Column('refresh_token', sa.String(length=255), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['brand_id'], ['umt.brands.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    
    # Ad Campaigns
    op.create_table('ad_campaigns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=50), nullable=False),
        sa.Column('budget', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['brand_id'], ['umt.brands.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    
    # Competitors
    op.create_table('competitors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['brand_id'], ['umt.brands.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    
    # Competitor Social Accounts
    op.create_table('competitor_social_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('competitor_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=50), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['competitor_id'], ['umt.competitors.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    
    # System tables
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('read', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    
    # Integrations
    op.create_table('integrations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('integration_type', sa.String(length=50), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['brand_id'], ['umt.brands.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )


def downgrade():
    # Drop all tables in reverse order to avoid foreign key constraint issues
    op.drop_table('integrations', schema='umt')
    op.drop_table('notifications', schema='umt')
    op.drop_table('competitor_social_accounts', schema='umt')
    op.drop_table('competitors', schema='umt')
    op.drop_table('ad_campaigns', schema='umt')
    op.drop_table('social_accounts', schema='umt')
    op.drop_table('content_drafts', schema='umt')
    op.drop_table('content', schema='umt')
    op.drop_table('projects', schema='umt')
    op.drop_table('project_types', schema='umt')
    op.drop_table('brands', schema='umt')
    op.drop_table('users', schema='umt')
    
    # Drop schema - Only drop if empty
    op.execute(text('DROP SCHEMA IF EXISTS umt CASCADE'))
