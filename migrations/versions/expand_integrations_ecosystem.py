"""Expand integrations ecosystem

Revision ID: expand_integrations_ecosystem
Revises: e8f247a91b56
Create Date: 2025-03-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'expand_integrations_ecosystem'
down_revision = 'e8f247a91b56'
branch_labels = None
depends_on = None


def upgrade():
    # Create email_accounts table
    op.create_table('email_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=50), nullable=False),
        sa.Column('api_key', sa.Text(), nullable=True),
        sa.Column('api_key_salt', sa.Text(), nullable=True),
        sa.Column('api_secret', sa.Text(), nullable=True),
        sa.Column('api_secret_salt', sa.Text(), nullable=True),
        sa.Column('access_token', sa.Text(), nullable=True),
        sa.Column('access_token_salt', sa.Text(), nullable=True),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('refresh_token_salt', sa.Text(), nullable=True),
        sa.Column('account_id', sa.String(length=255), nullable=True),
        sa.Column('data_center', sa.String(length=50), nullable=True),
        sa.Column('server_prefix', sa.String(length=50), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('health_status', sa.String(length=50), nullable=True),
        sa.Column('last_health_check', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['brand_id'], ['umt.brands.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_email_accounts_id'), 'email_accounts', ['id'], unique=False, schema='umt')

    # Create analytics_accounts table
    op.create_table('analytics_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(length=50), nullable=False),
        sa.Column('property_id', sa.String(length=255), nullable=True),
        sa.Column('view_id', sa.String(length=255), nullable=True),
        sa.Column('api_key', sa.Text(), nullable=True),
        sa.Column('api_key_salt', sa.Text(), nullable=True),
        sa.Column('api_secret', sa.Text(), nullable=True),
        sa.Column('api_secret_salt', sa.Text(), nullable=True),
        sa.Column('access_token', sa.Text(), nullable=True),
        sa.Column('access_token_salt', sa.Text(), nullable=True),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('refresh_token_salt', sa.Text(), nullable=True),
        sa.Column('service_account_json', sa.Text(), nullable=True),
        sa.Column('service_account_json_salt', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('health_status', sa.String(length=50), nullable=True),
        sa.Column('last_health_check', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['brand_id'], ['umt.brands.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_analytics_accounts_id'), 'analytics_accounts', ['id'], unique=False, schema='umt')

    # Create api_keys table
    op.create_table('api_keys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('key_name', sa.String(length=100), nullable=False),
        sa.Column('api_key', sa.String(length=64), nullable=False),
        sa.Column('api_key_salt', sa.String(length=32), nullable=False),
        sa.Column('scopes', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('rate_limit', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['brand_id'], ['umt.brands.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id']),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_api_keys_id'), 'api_keys', ['id'], unique=False, schema='umt')
    op.create_index(op.f('ix_umt_api_keys_api_key'), 'api_keys', ['api_key'], unique=False, schema='umt')

    # Create webhooks table
    op.create_table('webhooks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('url', sa.String(length=255), nullable=False),
        sa.Column('events', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('secret_key', sa.String(length=64), nullable=True),
        sa.Column('secret_key_salt', sa.String(length=32), nullable=True),
        sa.Column('format', sa.String(length=20), nullable=False, server_default='json'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['brand_id'], ['umt.brands.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id']),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index(op.f('ix_umt_webhooks_id'), 'webhooks', ['id'], unique=False, schema='umt')

    # Add relationship columns to Brand model
    op.execute('ALTER TABLE umt.brands ADD COLUMN email_accounts_relation INTEGER;')
    op.execute('ALTER TABLE umt.brands ADD COLUMN analytics_accounts_relation INTEGER;')
    op.execute('ALTER TABLE umt.brands ADD COLUMN api_keys_relation INTEGER;')
    op.execute('ALTER TABLE umt.brands ADD COLUMN webhooks_relation INTEGER;')

    # Create or update IntegrationHealth to support new integration types
    try:
        # Check if the table exists first
        op.execute("SELECT 1 FROM information_schema.tables WHERE table_schema = 'umt' AND table_name = 'integration_health';")
        
        # If the table exists, update the enum type
        op.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_health_integration_type') THEN "
                  "ALTER TYPE umt.integration_health_integration_type RENAME TO integration_health_integration_type_old; "
                  "CREATE TYPE umt.integration_health_integration_type AS ENUM ('social', 'cms', 'ad', 'email', 'analytics'); "
                  "ALTER TABLE umt.integration_health ALTER COLUMN integration_type TYPE umt.integration_health_integration_type "
                  "USING integration_type::text::umt.integration_health_integration_type; "
                  "DROP TYPE umt.integration_health_integration_type_old; "
                  "END IF; END $$;")
    except Exception as e:
        # If the table doesn't exist, create the enum type for future use
        op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_health_integration_type') THEN "
                  "CREATE TYPE umt.integration_health_integration_type AS ENUM ('social', 'cms', 'ad', 'email', 'analytics'); "
                  "END IF; END $$;")


def downgrade():
    # Restore IntegrationHealth to previous state if it exists
    try:
        op.execute("SELECT 1 FROM information_schema.tables WHERE table_schema = 'umt' AND table_name = 'integration_health';")
        
        # If the table exists, restore the enum type
        op.execute("DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_health_integration_type') THEN "
                  "ALTER TYPE umt.integration_health_integration_type RENAME TO integration_health_integration_type_old; "
                  "CREATE TYPE umt.integration_health_integration_type AS ENUM ('social', 'cms', 'ad'); "
                  "ALTER TABLE umt.integration_health ALTER COLUMN integration_type TYPE umt.integration_health_integration_type "
                  "USING CASE WHEN integration_type::text = 'email' THEN 'social'::umt.integration_health_integration_type "
                  "WHEN integration_type::text = 'analytics' THEN 'social'::umt.integration_health_integration_type "
                  "ELSE integration_type::text::umt.integration_health_integration_type END; "
                  "DROP TYPE umt.integration_health_integration_type_old; "
                  "END IF; END $$;")
    except Exception:
        # If the table doesn't exist, just drop the type if it exists
        op.execute("DO $$ BEGIN DROP TYPE IF EXISTS umt.integration_health_integration_type; END $$;")

    # Remove relationship columns from Brand model
    op.execute('ALTER TABLE umt.brands DROP COLUMN IF EXISTS email_accounts_relation;')
    op.execute('ALTER TABLE umt.brands DROP COLUMN IF EXISTS analytics_accounts_relation;')
    op.execute('ALTER TABLE umt.brands DROP COLUMN IF EXISTS api_keys_relation;')
    op.execute('ALTER TABLE umt.brands DROP COLUMN IF EXISTS webhooks_relation;')

    # Drop webhooks table
    op.drop_index(op.f('ix_umt_webhooks_id'), table_name='webhooks', schema='umt')
    op.drop_table('webhooks', schema='umt')

    # Drop api_keys table
    op.drop_index(op.f('ix_umt_api_keys_api_key'), table_name='api_keys', schema='umt')
    op.drop_index(op.f('ix_umt_api_keys_id'), table_name='api_keys', schema='umt')
    op.drop_table('api_keys', schema='umt')

    # Drop analytics_accounts table
    op.drop_index(op.f('ix_umt_analytics_accounts_id'), table_name='analytics_accounts', schema='umt')
    op.drop_table('analytics_accounts', schema='umt')

    # Drop email_accounts table
    op.drop_index(op.f('ix_umt_email_accounts_id'), table_name='email_accounts', schema='umt')
    op.drop_table('email_accounts', schema='umt')