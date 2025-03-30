# Scripts Guide

Scripts have been reorganized into the `/scripts` directory with the following structure:

## Common Scripts

### Database Migration Scripts
- **Manage Migrations:** `scripts/migrations/manage_migrations.py`
  - Create new migrations: `python scripts/migrations/manage_migrations.py create --message "Migration description" --autogenerate`
  - Apply migrations: `python scripts/migrations/manage_migrations.py upgrade`
  - Show migration history: `python scripts/migrations/manage_migrations.py history`

### Deployment Scripts
- **Deploy to Staging:** `scripts/deploy/deploy_staging.sh`
  - Usage: `./scripts/deploy/deploy_staging.sh`
- **Quick Deploy:** `scripts/deploy/quick_deploy.sh`
  - Usage: `./scripts/deploy/quick_deploy.sh deployment_archives/staging_deploy_20250328_112844.tar.gz`

### Compliance Scripts
- **Run Compliance Tests:** `scripts/compliance/run_compliance_tests.py`
  - Usage: `python scripts/compliance/run_compliance_tests.py`

### Testing Scripts
- **API Tests:** `scripts/testing/api/test_api.py` and `scripts/testing/api/test_templates_api.py`
- **Test Runner:** `scripts/testing/run_tests.py`

### Utility Scripts
- **Fix Imports:** `scripts/utilities/codebase/fix_imports.py`
- **Update Models:** `scripts/utilities/codebase/update_models.py`
- **Logging Utils:** `scripts/utilities/logging_utils.py`
- **Verify Actions:** `scripts/utilities/verify_actions.py`

## Makefile Shortcuts

For convenience, you can use Makefile shortcuts:
```
make test                 # Run all tests
make test-migrations      # Run migration tests
make migrate-up           # Apply migrations
make migrate-down         # Rollback migration
make migrate-create       # Create new migration
```

See `scripts/README.md` for more details about all available scripts.