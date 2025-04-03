"""Merge multiple heads

Revision ID: merge_heads_migration
Revises: 1f58cb74d3e2, 85f2add36528, data_retention_compliance
Create Date: 2025-03-27 08:46:00.000000

This migration merges the multiple head revisions to create a single head.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_heads_migration'
down_revision = ('1f58cb74d3e2', '85f2add36528', 'data_retention_compliance')
branch_labels = None
depends_on = None


def upgrade():
    # This is a merge migration, so no schema changes needed
    pass


def downgrade():
    # This is a merge migration, so no schema changes needed
    pass
