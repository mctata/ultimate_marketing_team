"""add security enhancements

Revision ID: security_enhancement_migration
Revises: db3a8f42c01c
Create Date: 2025-03-21 18:47:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'security_enhancement_migration'
down_revision = 'db3a8f42c01c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add MFA fields to users table
    op.add_column('users', sa.Column('mfa_enabled', sa.Boolean(), server_default='false', nullable=False), schema='umt')
    op.add_column('users', sa.Column('mfa_type', sa.String(length=20), nullable=True), schema='umt')
    op.add_column('users', sa.Column('totp_secret_encrypted', sa.String(length=255), nullable=True), schema='umt')
    op.add_column('users', sa.Column('totp_secret_salt', sa.String(length=255), nullable=True), schema='umt')
    op.add_column('users', sa.Column('mfa_backup_codes', sa.JSON(), nullable=True), schema='umt')
    op.add_column('users', sa.Column('phone_number', sa.String(length=20), nullable=True), schema='umt')
    
    # Create user_devices table
    op.create_table('user_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.String(length=50), nullable=False),
        sa.Column('device_name', sa.String(length=100), nullable=True),
        sa.Column('device_type', sa.String(length=20), nullable=False),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('last_used', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_trusted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], name='fk_user_devices_user_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('device_id'),
        schema='umt'
    )
    op.create_index('ix_umt_user_devices_user_id', 'user_devices', ['user_id'], unique=False, schema='umt')
    op.create_index('ix_umt_user_devices_device_id', 'user_devices', ['device_id'], unique=False, schema='umt')
    
    # Create user_sessions table
    op.create_table('user_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.String(length=50), nullable=False),
        sa.Column('session_id', sa.String(length=50), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_activity', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], name='fk_user_sessions_user_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['device_id'], ['umt.user_devices.device_id'], name='fk_user_sessions_device_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id'),
        schema='umt'
    )
    op.create_index('ix_umt_user_sessions_user_id', 'user_sessions', ['user_id'], unique=False, schema='umt')
    op.create_index('ix_umt_user_sessions_session_id', 'user_sessions', ['session_id'], unique=False, schema='umt')
    op.create_index('ix_umt_user_sessions_device_id', 'user_sessions', ['device_id'], unique=False, schema='umt')
    
    # Create security_events table for tracking security-related events
    op.create_table('security_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('device_id', sa.String(length=50), nullable=True),
        sa.Column('session_id', sa.String(length=50), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], name='fk_security_events_user_id', ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index('ix_umt_security_events_user_id', 'security_events', ['user_id'], unique=False, schema='umt')
    op.create_index('ix_umt_security_events_event_type', 'security_events', ['event_type'], unique=False, schema='umt')
    op.create_index('ix_umt_security_events_created_at', 'security_events', ['created_at'], unique=False, schema='umt')
    
    # Create blocked_ips table for rate limiting
    op.create_table('blocked_ips',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=False),
        sa.Column('reason', sa.String(length=100), nullable=False),
        sa.Column('blocked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_permanent', sa.Boolean(), server_default='false', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ip_address'),
        schema='umt'
    )
    
    # Create content_security_scans table for tracking malware scans
    op.create_table('content_security_scans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('content_type', sa.String(length=50), nullable=False),
        sa.Column('content_hash', sa.String(length=64), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('scan_result', sa.String(length=20), nullable=False),
        sa.Column('threat_name', sa.String(length=100), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], name='fk_content_security_scans_user_id', ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index('ix_umt_content_security_scans_content_hash', 'content_security_scans', ['content_hash'], unique=False, schema='umt')
    op.create_index('ix_umt_content_security_scans_scan_result', 'content_security_scans', ['scan_result'], unique=False, schema='umt')
    
    # Create oauth_states table for tracking OAuth state parameters
    op.create_table('oauth_states',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('redirect_uri', sa.String(length=255), nullable=False),
        sa.Column('code_challenge', sa.String(length=128), nullable=True),
        sa.Column('code_challenge_method', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], name='fk_oauth_states_user_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('state'),
        schema='umt'
    )
    
    # Create drm_content table for tracking content with DRM
    op.create_table('drm_content',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_id', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(length=50), nullable=False),
        sa.Column('drm_type', sa.String(length=50), nullable=False),
        sa.Column('restrictions', sa.JSON(), nullable=True),
        sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('max_views', sa.Integer(), nullable=True),
        sa.Column('view_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], name='fk_drm_content_user_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('content_id'),
        schema='umt'
    )
    op.create_index('ix_umt_drm_content_content_id', 'drm_content', ['content_id'], unique=False, schema='umt')


def downgrade() -> None:
    # Drop tables
    op.drop_table('drm_content', schema='umt')
    op.drop_table('oauth_states', schema='umt')
    op.drop_table('content_security_scans', schema='umt')
    op.drop_table('blocked_ips', schema='umt')
    op.drop_table('security_events', schema='umt')
    op.drop_table('user_sessions', schema='umt')
    op.drop_table('user_devices', schema='umt')
    
    # Drop columns from users table
    op.drop_column('users', 'phone_number', schema='umt')
    op.drop_column('users', 'mfa_backup_codes', schema='umt')
    op.drop_column('users', 'totp_secret_salt', schema='umt')
    op.drop_column('users', 'totp_secret_encrypted', schema='umt')
    op.drop_column('users', 'mfa_type', schema='umt')
    op.drop_column('users', 'mfa_enabled', schema='umt')