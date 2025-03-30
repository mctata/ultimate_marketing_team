# Codebase Utilities

This directory contains utility scripts for managing and modifying the codebase.

## Available Utilities

### Fix Imports

The `fix_imports.py` script verifies and fixes import paths in the project to ensure proper structure. It's particularly useful for maintaining correct import paths in the frontend code.

```bash
# Check for improper imports (dry run)
python -m scripts.utilities.codebase.fix_imports --dry-run

# Fix improper imports
python -m scripts.utilities.codebase.fix_imports

# Only check/fix Python imports
python -m scripts.utilities.codebase.fix_imports --python-only
```

### Update Models

The `update_models.py` script automatically updates model relationship definitions to ensure proper connections between models in the SQLAlchemy ORM.

```bash
# Update models with missing relationships
python -m scripts.utilities.codebase.update_models
```

## Usage in CI/CD

These utilities can be integrated into CI/CD pipelines to maintain code quality:

```yaml
# Example GitHub Actions step
- name: Check for improper imports
  run: python -m scripts.utilities.codebase.fix_imports --dry-run

# Example pre-commit hook
- id: fix-imports
  name: Fix imports
  entry: python -m scripts.utilities.codebase.fix_imports
  language: system
  types: [file, python, typescript, javascript]
```