-- Initialize database schema

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create schema
CREATE SCHEMA IF NOT EXISTS umt;

-- Users table
CREATE TABLE IF NOT EXISTS umt.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OAuth accounts table
CREATE TABLE IF NOT EXISTS umt.oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES umt.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Brands table
CREATE TABLE IF NOT EXISTS umt.brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website_url VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(255),
    created_by INTEGER REFERENCES umt.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Brand guidelines table
CREATE TABLE IF NOT EXISTS umt.brand_guidelines (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES umt.brands(id) ON DELETE CASCADE,
    voice TEXT,
    tone TEXT,
    color_palette JSONB,
    typography JSONB,
    imagery_style TEXT,
    logos JSONB,
    target_audience JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project types table
CREATE TABLE IF NOT EXISTS umt.project_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS umt.projects (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES umt.brands(id) ON DELETE CASCADE,
    project_type_id INTEGER NOT NULL REFERENCES umt.project_types(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_by INTEGER REFERENCES umt.users(id),
    assigned_to INTEGER REFERENCES umt.users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content topics table
CREATE TABLE IF NOT EXISTS umt.content_topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    keywords JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content drafts table
CREATE TABLE IF NOT EXISTS umt.content_drafts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES umt.projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    feedback TEXT,
    created_by INTEGER REFERENCES umt.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- A/B Testing table
CREATE TABLE IF NOT EXISTS umt.ab_tests (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES umt.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- A/B Test Variants table
CREATE TABLE IF NOT EXISTS umt.ab_test_variants (
    id SERIAL PRIMARY KEY,
    ab_test_id INTEGER NOT NULL REFERENCES umt.ab_tests(id) ON DELETE CASCADE,
    content_draft_id INTEGER NOT NULL REFERENCES umt.content_drafts(id),
    variant_name VARCHAR(50) NOT NULL,
    is_control BOOLEAN DEFAULT FALSE,
    impressions INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Social media accounts table
CREATE TABLE IF NOT EXISTS umt.social_accounts (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES umt.brands(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CMS accounts table
CREATE TABLE IF NOT EXISTS umt.cms_accounts (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES umt.brands(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    site_url VARCHAR(255) NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    username VARCHAR(255),
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ad accounts table
CREATE TABLE IF NOT EXISTS umt.ad_accounts (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES umt.brands(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content calendar table
CREATE TABLE IF NOT EXISTS umt.content_calendar (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES umt.projects(id) ON DELETE CASCADE,
    content_draft_id INTEGER REFERENCES umt.content_drafts(id),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    published_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Competitor tracking table
CREATE TABLE IF NOT EXISTS umt.competitors (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES umt.brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    website_url VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Competitor content table
CREATE TABLE IF NOT EXISTS umt.competitor_content (
    id SERIAL PRIMARY KEY,
    competitor_id INTEGER NOT NULL REFERENCES umt.competitors(id) ON DELETE CASCADE,
    content_url VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    published_date TIMESTAMP WITH TIME ZONE,
    engagement_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ad campaigns table
CREATE TABLE IF NOT EXISTS umt.ad_campaigns (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES umt.brands(id) ON DELETE CASCADE,
    ad_account_id INTEGER NOT NULL REFERENCES umt.ad_accounts(id),
    platform VARCHAR(50) NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_objective VARCHAR(50),
    budget DECIMAL(15, 2),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft',
    platform_campaign_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ad sets/ad groups table
CREATE TABLE IF NOT EXISTS umt.ad_sets (
    id SERIAL PRIMARY KEY,
    ad_campaign_id INTEGER NOT NULL REFERENCES umt.ad_campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    targeting JSONB,
    budget DECIMAL(15, 2),
    bid_strategy VARCHAR(50),
    platform_ad_set_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ads table
CREATE TABLE IF NOT EXISTS umt.ads (
    id SERIAL PRIMARY KEY,
    ad_set_id INTEGER NOT NULL REFERENCES umt.ad_sets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content_draft_id INTEGER REFERENCES umt.content_drafts(id),
    ad_format VARCHAR(50),
    headline VARCHAR(255),
    description TEXT,
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    call_to_action VARCHAR(50),
    destination_url VARCHAR(255),
    platform_ad_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ad performance metrics table
CREATE TABLE IF NOT EXISTS umt.ad_performance (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER REFERENCES umt.ads(id) ON DELETE CASCADE,
    ad_set_id INTEGER REFERENCES umt.ad_sets(id) ON DELETE CASCADE,
    ad_campaign_id INTEGER REFERENCES umt.ad_campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    spend DECIMAL(15, 2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(15, 2) DEFAULT 0,
    ctr DECIMAL(10, 4),
    cpc DECIMAL(10, 4),
    cpa DECIMAL(10, 4),
    roas DECIMAL(10, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ad_id, date)
);

-- Content performance metrics table
CREATE TABLE IF NOT EXISTS umt.content_performance (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES umt.projects(id) ON DELETE CASCADE,
    content_draft_id INTEGER REFERENCES umt.content_drafts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    views INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversion_rate DECIMAL(10, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_draft_id, date, platform)
);

-- System logs table
CREATE TABLE IF NOT EXISTS umt.system_logs (
    id SERIAL PRIMARY KEY,
    log_level VARCHAR(20) NOT NULL,
    component VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Default project types
INSERT INTO umt.project_types (name, description) VALUES
('Email', 'Email marketing campaigns and newsletters'),
('Landing Page', 'Website landing pages for campaigns'),
('Social Post', 'Content for social media platforms'),
('Blog', 'Blog articles and content marketing'),
('Ad Copy', 'Text for digital advertising campaigns')
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON umt.users(email);
CREATE INDEX IF NOT EXISTS idx_brands_name ON umt.brands(name);
CREATE INDEX IF NOT EXISTS idx_projects_brand_id ON umt.projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_project_id ON umt.content_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_date ON umt.content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_ad_performance_date ON umt.ad_performance(date);
CREATE INDEX IF NOT EXISTS idx_content_performance_date ON umt.content_performance(date);
