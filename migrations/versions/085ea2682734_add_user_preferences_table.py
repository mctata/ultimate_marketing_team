"""Add user preferences table

Revision ID: 085ea2682734
Revises: c16d574b5146
Create Date: 2025-03-21 11:42:20.062505

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '085ea2682734'
down_revision = 'c16d574b5146'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add user_preferences table to store personalized settings for each user.
    This includes UI preferences, notification settings, and default views.
    """
    # Create user_preferences table
    op.create_table('user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('theme', sa.String(length=20), nullable=True, server_default='light'),
        sa.Column('notifications_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('email_frequency', sa.String(length=20), nullable=True, server_default='daily'),
        sa.Column('default_dashboard_view', sa.String(length=50), nullable=True),
        sa.Column('timezone', sa.String(length=50), nullable=True, server_default='UTC'),
        sa.Column('language', sa.String(length=10), nullable=True, server_default='en'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('settings', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        schema='umt'
    )
    
    # Add index for faster lookups
    op.create_index(op.f('ix_umt_user_preferences_user_id'), 'user_preferences', ['user_id'], unique=True, schema='umt')


def downgrade():
    """
    Remove user_preferences table
    """
    # Drop index first
    op.drop_index(op.f('ix_umt_user_preferences_user_id'), table_name='user_preferences', schema='umt')
    
    # Drop table
    op.drop_table('user_preferences', schema='umt')
