"""Add templates library tables

Revision ID: f9562bda71c9
Revises: 
Create Date: 2025-03-23 06:25:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'f9562bda71c9'
down_revision = None  # Replace with the previous migration revision ID
branch_labels = None
depends_on = None


def upgrade():
    # Create template_industries table
    op.create_table(
        'template_industries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_template_industries_id'), 'template_industries', ['id'], unique=False, schema='umt')
    
    # Create template_categories table
    op.create_table(
        'template_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_template_categories_id'), 'template_categories', ['id'], unique=False, schema='umt')
    
    # Create template_formats table
    op.create_table(
        'template_formats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('platform', sa.String(length=255), nullable=True),
        sa.Column('content_type', sa.String(length=255), nullable=False),
        sa.Column('specs', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_template_formats_id'), 'template_formats', ['id'], unique=False, schema='umt')
    
    # Create templates table
    op.create_table(
        'templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('format_id', sa.Integer(), nullable=False),
        sa.Column('preview_image', sa.String(length=512), nullable=True),
        sa.Column('dynamic_fields', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('tone_options', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_featured', sa.Boolean(), nullable=True),
        sa.Column('is_premium', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('community_rating', sa.Float(), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id'], ),
        sa.ForeignKeyConstraint(['format_id'], ['umt.template_formats.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_templates_id'), 'templates', ['id'], unique=False, schema='umt')
    
    # Create template_category_association table
    op.create_table(
        'template_category_association',
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('template_category_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['template_category_id'], ['umt.template_categories.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['umt.templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('template_id', 'template_category_id'),
        schema='umt'
    )
    
    # Create template_industry_association table
    op.create_table(
        'template_industry_association',
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('template_industry_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['template_industry_id'], ['umt.template_industries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['umt.templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('template_id', 'template_industry_id'),
        schema='umt'
    )
    
    # Create template_ratings table
    op.create_table(
        'template_ratings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['template_id'], ['umt.templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_template_ratings_id'), 'template_ratings', ['id'], unique=False, schema='umt')
    
    # Create template_usage table
    op.create_table(
        'template_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content_draft_id', sa.Integer(), nullable=True),
        sa.Column('customizations', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['content_draft_id'], ['umt.content_drafts.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['umt.templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_template_usage_id'), 'template_usage', ['id'], unique=False, schema='umt')
    
    # Create template_versions table
    op.create_table(
        'template_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('dynamic_fields', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('changes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['umt.templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_template_versions_id'), 'template_versions', ['id'], unique=False, schema='umt')
    
    # Create template_favorites table
    op.create_table(
        'template_favorites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['template_id'], ['umt.templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_template_favorites_id'), 'template_favorites', ['id'], unique=False, schema='umt')


def downgrade():
    # Drop tables in reverse order of creation to handle dependencies
    op.drop_index(op.f('ix_umt_template_favorites_id'), table_name='template_favorites', schema='umt')
    op.drop_table('template_favorites', schema='umt')
    
    op.drop_index(op.f('ix_umt_template_versions_id'), table_name='template_versions', schema='umt')
    op.drop_table('template_versions', schema='umt')
    
    op.drop_index(op.f('ix_umt_template_usage_id'), table_name='template_usage', schema='umt')
    op.drop_table('template_usage', schema='umt')
    
    op.drop_index(op.f('ix_umt_template_ratings_id'), table_name='template_ratings', schema='umt')
    op.drop_table('template_ratings', schema='umt')
    
    op.drop_table('template_industry_association', schema='umt')
    op.drop_table('template_category_association', schema='umt')
    
    op.drop_index(op.f('ix_umt_templates_id'), table_name='templates', schema='umt')
    op.drop_table('templates', schema='umt')
    
    op.drop_index(op.f('ix_umt_template_formats_id'), table_name='template_formats', schema='umt')
    op.drop_table('template_formats', schema='umt')
    
    op.drop_index(op.f('ix_umt_template_categories_id'), table_name='template_categories', schema='umt')
    op.drop_table('template_categories', schema='umt')
    
    op.drop_index(op.f('ix_umt_template_industries_id'), table_name='template_industries', schema='umt')
    op.drop_table('template_industries', schema='umt')
