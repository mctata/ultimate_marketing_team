"""Add JWT secret rotation and security alerts support

Revision ID: jwt_secret_rotation_migration
Revises: security_enhancement_migration
Create Date: 2025-03-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'jwt_secret_rotation_migration'
down_revision = 'security_enhancement_migration'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add JWT secret keys table
    op.create_table('jwt_secret_keys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key_id', sa.String(length=36), nullable=False),
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key_id'),
        schema='umt'
    )
    op.create_index('ix_umt_jwt_secret_keys_id', 'jwt_secret_keys', ['id'], unique=False, schema='umt')
    op.create_index('ix_umt_jwt_secret_keys_key_id', 'jwt_secret_keys', ['key_id'], unique=False, schema='umt')
    
    # Add security alerts table
    op.create_table('security_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('source_ip', sa.String(length=50), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('message', sa.String(length=500), nullable=False),
        sa.Column('details', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by_user_id', sa.Integer(), nullable=True),
        sa.Column('resolution_notes', sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(['resolved_by_user_id'], ['umt.users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index('ix_umt_security_alerts_id', 'security_alerts', ['id'], unique=False, schema='umt')
    op.create_index('ix_umt_security_alerts_user_id', 'security_alerts', ['user_id'], unique=False, schema='umt')


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_umt_security_alerts_user_id', table_name='security_alerts', schema='umt')
    op.drop_index('ix_umt_security_alerts_id', table_name='security_alerts', schema='umt')
    op.drop_table('security_alerts', schema='umt')
    
    op.drop_index('ix_umt_jwt_secret_keys_key_id', table_name='jwt_secret_keys', schema='umt')
    op.drop_index('ix_umt_jwt_secret_keys_id', table_name='jwt_secret_keys', schema='umt')
    op.drop_table('jwt_secret_keys', schema='umt')