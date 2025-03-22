"""Add data retention and compliance features

Revision ID: data_retention_compliance
Revises: security_enhancement_migration
Create Date: 2025-03-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'data_retention_compliance'
down_revision = 'security_enhancement_migration'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create data retention policy table
    op.create_table('data_retention_policies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('retention_period_days', sa.Integer(), nullable=False),
        sa.Column('archive_strategy', sa.String(length=20), nullable=False),
        sa.Column('legal_basis', sa.String(length=100), nullable=True),
        sa.Column('applies_to_deleted', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('entity_type'),
        schema='umt'
    )
    
    # Create data retention exemptions table
    op.create_table('data_retention_exemptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id'], name='fk_data_retention_exemptions_user_id'),
        sa.ForeignKeyConstraint(['entity_type'], ['umt.data_retention_policies.entity_type'], name='fk_data_retention_exemptions_entity_type'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('entity_type', 'entity_id', name='uq_retention_exemption_entity'),
        schema='umt'
    )
    
    # Create data retention execution log
    op.create_table('data_retention_execution_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('records_processed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_archived', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_deleted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('execution_time_sec', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['entity_type'], ['umt.data_retention_policies.entity_type'], name='fk_data_retention_logs_entity_type'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    
    # Create consent records table
    op.create_table('consent_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('consent_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.Boolean(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('consent_version', sa.String(length=50), nullable=False),
        sa.Column('data_categories', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], name='fk_consent_records_user_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index('ix_umt_consent_records_user_id', 'consent_records', ['user_id'], schema='umt')
    op.create_index('ix_umt_consent_records_consent_type', 'consent_records', ['consent_type'], schema='umt')
    op.create_index('ix_umt_consent_records_recorded_at', 'consent_records', ['recorded_at'], schema='umt')
    
    # Create data subject requests table
    op.create_table('data_subject_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('request_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('request_details', sa.JSON(), nullable=True),
        sa.Column('requester_email', sa.String(length=255), nullable=False),
        sa.Column('verification_method', sa.String(length=50), nullable=True),
        sa.Column('verification_status', sa.Boolean(), nullable=True),
        sa.Column('completion_notes', sa.Text(), nullable=True),
        sa.Column('admin_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['umt.users.id'], name='fk_data_subject_requests_user_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['admin_user_id'], ['umt.users.id'], name='fk_data_subject_requests_admin_user_id', ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index('ix_umt_data_subject_requests_user_id', 'data_subject_requests', ['user_id'], schema='umt')
    op.create_index('ix_umt_data_subject_requests_status', 'data_subject_requests', ['status'], schema='umt')
    
    # Create compliance documents table
    op.create_table('compliance_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('version', sa.String(length=20), nullable=False),
        sa.Column('effective_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_current', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id'], name='fk_compliance_documents_created_by'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_type', 'version', name='uq_document_type_version'),
        schema='umt'
    )
    op.create_index('ix_umt_compliance_documents_document_type', 'compliance_documents', ['document_type'], schema='umt')
    op.create_index('ix_umt_compliance_documents_is_current', 'compliance_documents', ['is_current'], schema='umt')
    
    # Create data classifications table
    op.create_table('data_classifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('access_requirements', sa.Text(), nullable=False),
        sa.Column('encryption_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('retention_requirements', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        schema='umt'
    )
    
    # Create field classifications table
    op.create_table('field_classifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('table_name', sa.String(length=100), nullable=False),
        sa.Column('field_name', sa.String(length=100), nullable=False),
        sa.Column('classification_id', sa.Integer(), nullable=False),
        sa.Column('is_pii', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_encrypted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('mask_display', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['classification_id'], ['umt.data_classifications.id'], name='fk_field_classifications_classification_id'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('table_name', 'field_name', name='uq_field_classification'),
        schema='umt'
    )
    op.create_index('ix_umt_field_classifications_is_pii', 'field_classifications', ['is_pii'], schema='umt')
    
    # Create privacy impact assessments table
    op.create_table('privacy_impact_assessments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('feature_description', sa.Text(), nullable=False),
        sa.Column('data_collected', sa.JSON(), nullable=False),
        sa.Column('data_use', sa.Text(), nullable=False),
        sa.Column('data_sharing', sa.Text(), nullable=True),
        sa.Column('risks_identified', sa.JSON(), nullable=True),
        sa.Column('mitigations', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['umt.users.id'], name='fk_privacy_impact_assessments_created_by'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['umt.users.id'], name='fk_privacy_impact_assessments_reviewer_id'),
        sa.PrimaryKeyConstraint('id'),
        schema='umt'
    )
    op.create_index('ix_umt_privacy_impact_assessments_status', 'privacy_impact_assessments', ['status'], schema='umt')
    
    # Add soft delete columns to relevant tables
    tables_to_modify = [
        'users', 'brands', 'projects', 'content', 'content_drafts', 
        'ad_campaigns', 'competitors', 'social_accounts'
    ]
    
    for table in tables_to_modify:
        op.add_column(table, sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True), schema='umt')
        op.add_column(table, sa.Column('deleted_by', sa.Integer(), nullable=True), schema='umt')
        op.add_column(table, sa.Column('scheduled_deletion_date', sa.DateTime(timezone=True), nullable=True), schema='umt')
        
        # Create index for efficient querying of deleted items
        op.create_index(f'ix_umt_{table}_deleted_at', table, ['deleted_at'], schema='umt')
        
        # Add foreign key for deleted_by if it doesn't already exist
        try:
            op.create_foreign_key(
                f'fk_{table}_deleted_by_users',
                table,
                'users',
                ['deleted_by'],
                ['id'],
                source_schema='umt',
                referent_schema='umt',
                ondelete='SET NULL'
            )
        except Exception:
            # Skip if constraint already exists or can't be added
            pass
    
    # Insert default data classifications
    op.execute(
        """
        INSERT INTO umt.data_classifications 
        (name, description, access_requirements, encryption_required, retention_requirements)
        VALUES 
        ('public', 'Information that can be freely shared with the public', 'No special access requirements', false, 'Standard retention policy applies'),
        ('internal', 'Information for internal use only', 'Authenticated user access only', false, 'Retain according to business needs'),
        ('confidential', 'Sensitive business information', 'Role-based access control required', true, 'Minimum necessary retention, regular review'),
        ('restricted', 'Highly sensitive information including PII', 'Strict role-based access with audit trails', true, 'Minimum necessary retention, anonymize when possible')
        """
    )


def downgrade() -> None:
    # Drop added columns
    tables_to_modify = [
        'users', 'brands', 'projects', 'content', 'content_drafts', 
        'ad_campaigns', 'competitors', 'social_accounts'
    ]
    
    for table in tables_to_modify:
        op.drop_index(f'ix_umt_{table}_deleted_at', table_name=table, schema='umt')
        op.drop_column(table, 'scheduled_deletion_date', schema='umt')
        op.drop_column(table, 'deleted_by', schema='umt')
        op.drop_column(table, 'deleted_at', schema='umt')
    
    # Drop tables in reverse order of creation
    op.drop_table('privacy_impact_assessments', schema='umt')
    op.drop_table('field_classifications', schema='umt')
    op.drop_table('data_classifications', schema='umt')
    op.drop_table('compliance_documents', schema='umt')
    op.drop_table('data_subject_requests', schema='umt')
    op.drop_table('consent_records', schema='umt')
    op.drop_table('data_retention_execution_logs', schema='umt')
    op.drop_table('data_retention_exemptions', schema='umt')
    op.drop_table('data_retention_policies', schema='umt')