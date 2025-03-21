#!/bin/bash

# Create test users directly in the database using Docker
echo "Creating test users in the PostgreSQL database..."

# Create admin user
docker exec ultimate_marketing_team_postgres_1 psql -U postgres -d ultimatemarketing -c "
INSERT INTO umt.users (email, username, hashed_password, full_name, is_active, is_superuser, created_at, updated_at)
VALUES ('admin@example.com', 'admin', '\$2b\$12\$AzPT3p9.fzGXHO/kM8tQ8emQwU887ChS3WQxN1.cJ1NcMaHQ7TSIO', 'Admin User', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING
RETURNING id;
"

# Create editor user
docker exec ultimate_marketing_team_postgres_1 psql -U postgres -d ultimatemarketing -c "
INSERT INTO umt.users (email, username, hashed_password, full_name, is_active, is_superuser, created_at, updated_at)
VALUES ('editor@example.com', 'editor', '\$2b\$12\$AzPT3p9.fzGXHO/kM8tQ8emQwU887ChS3WQxN1.cJ1NcMaHQ7TSIO', 'Editor User', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING
RETURNING id;
"

# Get admin user ID
ADMIN_ID=$(docker exec ultimate_marketing_team_postgres_1 psql -U postgres -d ultimatemarketing -t -c "
SELECT id FROM umt.users WHERE email = 'admin@example.com';
")
ADMIN_ID=$(echo $ADMIN_ID | tr -d '[:space:]')

# Get editor user ID
EDITOR_ID=$(docker exec ultimate_marketing_team_postgres_1 psql -U postgres -d ultimatemarketing -t -c "
SELECT id FROM umt.users WHERE email = 'editor@example.com';
")
EDITOR_ID=$(echo $EDITOR_ID | tr -d '[:space:]')

# Get admin role ID
ADMIN_ROLE_ID=$(docker exec ultimate_marketing_team_postgres_1 psql -U postgres -d ultimatemarketing -t -c "
SELECT id FROM umt.roles WHERE name = 'admin';
")
ADMIN_ROLE_ID=$(echo $ADMIN_ROLE_ID | tr -d '[:space:]')

# Get content_creator role ID
EDITOR_ROLE_ID=$(docker exec ultimate_marketing_team_postgres_1 psql -U postgres -d ultimatemarketing -t -c "
SELECT id FROM umt.roles WHERE name = 'content_creator';
")
EDITOR_ROLE_ID=$(echo $EDITOR_ROLE_ID | tr -d '[:space:]')

# Assign admin role to admin user
docker exec ultimate_marketing_team_postgres_1 psql -U postgres -d ultimatemarketing -c "
INSERT INTO umt.user_roles (user_id, role_id)
VALUES ($ADMIN_ID, $ADMIN_ROLE_ID)
ON CONFLICT DO NOTHING;
"

# Assign content_creator role to editor user
docker exec ultimate_marketing_team_postgres_1 psql -U postgres -d ultimatemarketing -c "
INSERT INTO umt.user_roles (user_id, role_id)
VALUES ($EDITOR_ID, $EDITOR_ROLE_ID)
ON CONFLICT DO NOTHING;
"

echo ""
echo "==== TEST USER CREDENTIALS ===="
echo "Admin: admin@example.com / admin123"
echo "Editor: editor@example.com / editor123"
echo "============================="
echo ""