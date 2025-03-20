-- SQL Script to update the integration tables with encryption support and health monitoring
-- This should be run to upgrade the existing database schema

-- Add salt columns to social_accounts for encryption
ALTER TABLE umt.social_accounts 
ADD COLUMN IF NOT EXISTS access_token_salt TEXT,
ADD COLUMN IF NOT EXISTS refresh_token_salt TEXT,
ADD COLUMN IF NOT EXISTS health_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMP WITH TIME ZONE;

-- Add salt columns to cms_accounts for encryption
ALTER TABLE umt.cms_accounts 
ADD COLUMN IF NOT EXISTS api_key_salt TEXT,
ADD COLUMN IF NOT EXISTS api_secret_salt TEXT,
ADD COLUMN IF NOT EXISTS password_salt TEXT,
ADD COLUMN IF NOT EXISTS health_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMP WITH TIME ZONE;

-- Add salt columns and Google Ads specific fields to ad_accounts for encryption
ALTER TABLE umt.ad_accounts 
ADD COLUMN IF NOT EXISTS access_token_salt TEXT,
ADD COLUMN IF NOT EXISTS refresh_token_salt TEXT,
ADD COLUMN IF NOT EXISTS developer_token TEXT,
ADD COLUMN IF NOT EXISTS developer_token_salt TEXT,
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS client_id_salt TEXT,
ADD COLUMN IF NOT EXISTS client_secret TEXT,
ADD COLUMN IF NOT EXISTS client_secret_salt TEXT,
ADD COLUMN IF NOT EXISTS health_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMP WITH TIME ZONE;

-- Create a new table for health check history
CREATE TABLE IF NOT EXISTS umt.integration_health (
    id SERIAL PRIMARY KEY,
    integration_type VARCHAR(50) NOT NULL, -- social_media, cms, advertising
    integration_id INTEGER NOT NULL,
    check_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- healthy, unhealthy, degraded
    response_time_ms INTEGER,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_integration_health_lookup 
ON umt.integration_health(integration_type, integration_id);

CREATE INDEX IF NOT EXISTS idx_integration_health_time 
ON umt.integration_health(check_time);

CREATE INDEX IF NOT EXISTS idx_social_accounts_brand_platform 
ON umt.social_accounts(brand_id, platform);

CREATE INDEX IF NOT EXISTS idx_cms_accounts_brand_platform 
ON umt.cms_accounts(brand_id, platform);

CREATE INDEX IF NOT EXISTS idx_ad_accounts_brand_platform 
ON umt.ad_accounts(brand_id, platform);

-- Comment explaining the changes
COMMENT ON TABLE umt.integration_health IS 'Stores historical health check data for all integration types';
COMMENT ON COLUMN umt.social_accounts.access_token_salt IS 'Salt used for access token encryption';
COMMENT ON COLUMN umt.social_accounts.refresh_token_salt IS 'Salt used for refresh token encryption';
COMMENT ON COLUMN umt.social_accounts.health_status IS 'Current health status of the integration';
COMMENT ON COLUMN umt.social_accounts.last_health_check IS 'Timestamp of the last health check';