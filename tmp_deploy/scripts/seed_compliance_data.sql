-- Seed data for data retention policies
INSERT INTO umt.data_retention_policies 
(entity_type, retention_period_days, archive_strategy, legal_basis, applies_to_deleted, created_at, updated_at)
VALUES 
('user', 730, 'archive', 'GDPR Article 6(1)(c) - Legal obligation', true, now(), now()),
('content', 1095, 'archive', 'Business necessity', true, now(), now()),
('content_draft', 365, 'delete', 'Business necessity', true, now(), now()),
('project', 1095, 'archive', 'Business necessity', true, now(), now()),
('brand', 1825, 'archive', 'Business necessity', true, now(), now()),
('ad_campaign', 1095, 'archive', 'Business necessity', true, now(), now()),
('audit_log', 2555, 'archive', 'Legal obligation', true, now(), now());

-- Seed data for compliance documents
INSERT INTO umt.compliance_documents
(document_type, version, effective_date, content, is_current, created_by, created_at)
VALUES
('privacy_policy', '1.0', '2025-01-01', 'This is the initial privacy policy content. In a real implementation, this would contain the full privacy policy text.', true, 1, now()),
('terms_of_service', '1.0', '2025-01-01', 'This is the initial terms of service content. In a real implementation, this would contain the full terms of service text.', true, 1, now()),
('data_processing_agreement', '1.0', '2025-01-01', 'This is the initial data processing agreement content. In a real implementation, this would contain the full DPA text.', true, 1, now()),
('cookie_policy', '1.0', '2025-01-01', 'This is the initial cookie policy content. In a real implementation, this would contain the full cookie policy text.', true, 1, now());

-- Seed data for data classifications
INSERT INTO umt.data_classifications
(name, description, access_requirements, encryption_required, retention_requirements, created_at, updated_at)
VALUES
('public', 'Information that can be freely shared with the public', 'No special access requirements', false, 'Standard retention policy applies', now(), now()),
('internal', 'Information for internal use only', 'Authenticated user access only', false, 'Retain according to business needs', now(), now()),
('confidential', 'Sensitive business information', 'Role-based access control required', true, 'Minimum necessary retention, regular review', now(), now()),
('restricted', 'Highly sensitive information including PII', 'Strict role-based access with audit trails', true, 'Minimum necessary retention, anonymize when possible', now(), now());

-- Seed data for field classifications
INSERT INTO umt.field_classifications
(table_name, field_name, classification_id, is_pii, is_encrypted, mask_display, created_at, updated_at)
VALUES
-- User table PII fields
('users', 'email', 4, true, true, true, now(), now()),
('users', 'full_name', 4, true, true, true, now(), now()),
('users', 'hashed_password', 4, true, true, true, now(), now()),
-- Content fields
('content', 'title', 2, false, false, false, now(), now()),
('content', 'content', 2, false, false, false, now(), now()),
-- Project fields
('projects', 'name', 2, false, false, false, now(), now()),
('projects', 'description', 2, false, false, false, now(), now());

-- Sample privacy impact assessment
INSERT INTO umt.privacy_impact_assessments
(title, feature_description, data_collected, data_use, data_sharing, risks_identified, mitigations, status, created_by, created_at, updated_at)
VALUES
(
    'Social Media Integration Feature',
    'Feature to allow users to share content directly to social media platforms',
    '[{"category": "user_credentials", "purpose": "Authentication with social platforms"}, {"category": "content", "purpose": "Content to be shared"}]',
    'Authentication with social platforms and content sharing',
    'Data is shared with selected social media platforms based on user action',
    '[{"risk": "Unauthorized sharing", "severity": "high"}, {"risk": "Over-permissioning", "severity": "medium"}]',
    '[{"risk": "Unauthorized sharing", "mitigation": "Implement confirmation dialog"}, {"risk": "Over-permissioning", "mitigation": "Request minimal permissions"}]',
    'approved',
    1,
    now(),
    now()
);

-- Sample consent types for reference
-- Note: Actual consent records would be created when users provide consent
INSERT INTO umt.consent_records
(user_id, consent_type, status, recorded_at, consent_version, data_categories)
VALUES
(1, 'marketing', true, now(), '1.0', '["email", "preferences"]'),
(1, 'analytics', true, now(), '1.0', '["usage_data"]'),
(1, 'third_party', false, now(), '1.0', '["personal_info"]');