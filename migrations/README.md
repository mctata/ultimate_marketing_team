# Database Migrations Guide

This directory contains database migration scripts for the Ultimate Marketing Team (UMT) project.

## Overview

We use Alembic for database migrations. Migration scripts track changes to the database schema over time and allow us to:

1. Apply schema changes consistently across all environments
2. Roll back changes if needed
3. Keep a history of all schema modifications
4. Automatically generate migrations from SQLAlchemy model changes
5. Ensure all environments have the same database structure

## Migration Directory Structure

- `versions/` - Contains the actual migration scripts (each one is a Python file)
- `env.py` - The Alembic environment configuration
- `README.md` - This documentation file
- `script.py.mako` - Template used for generating new migration files

## Using Migrations

### For Local Development

We've created a helper script `manage_migrations.py` at the project root to make working with migrations easier.

#### Create a New Migration

When you make changes to SQLAlchemy models, create a new migration:

```bash
# Automatically generate migration based on model changes
python manage_migrations.py create --message "Add user preferences table" --autogenerate

# Create an empty migration (you'll need to write the upgrade/downgrade functions yourself)
python manage_migrations.py create --message "Add custom constraints"
```

#### Apply Migrations

To upgrade your database to the latest version:

```bash
python manage_migrations.py upgrade
```

To upgrade to a specific revision:

```bash
python manage_migrations.py upgrade 1a2b3c4d5e6f
```

#### Downgrade the Database

To revert migrations:

```bash
python manage_migrations.py downgrade 1a2b3c4d5e6f
```

#### View Migration History

```bash
# See migration history
python manage_migrations.py history

# See detailed history
python manage_migrations.py history --verbose

# See current migration
python manage_migrations.py current
```

### In Docker Environment

In Docker, we have a dedicated `migrations` service that handles database migrations automatically:

```bash
# Run migrations
docker-compose up migrations

# Run migrations and rebuild the container if needed
docker-compose up --build migrations
```

## Development Workflow

1. Make changes to SQLAlchemy models in the `src/models/` directory
2. Run `python manage_migrations.py create --message "Description of changes" --autogenerate` to create a migration
3. Review the generated migration file in `migrations/versions/` to ensure it correctly represents your changes
4. Run `python manage_migrations.py upgrade` to apply the migration to your development database
5. Commit both the model changes and the new migration file to version control

## Best Practices

1. **Always review auto-generated migrations** before applying them. Alembic is good but not perfect at detecting all changes.
2. **Create focused migrations** that do one thing (e.g., add a table, modify columns in a table, etc.).
3. **Include comprehensive docstrings** in migrations explaining what changes are being made and why.
4. **Test downgrade operations** to ensure they work correctly.
5. **Never edit existing migration files** that have been committed to version control or applied to any environment.
6. **Use explicit column names and types** in migrations rather than relying on `Column.copy()`.
7. **Handle data migrations carefully** - migrations that both change schema and move data are more complex and risky.

## Troubleshooting

### Common Issues

1. **"Can't locate revision"** - Make sure your Alembic version history matches your database revision history.
2. **"Target database is not up to date"** - Run `alembic upgrade head` to bring your database to the latest revision.
3. **"Relative revision identifiers require current version"** - The database doesn't have a current Alembic revision.
4. **"Multiple head revisions"** - Multiple migration branches exist. Merge them with `alembic merge`.

### Getting Help

If you encounter migration issues that aren't covered here, check:

- Alembic documentation: https://alembic.sqlalchemy.org/
- The project's internal documentation for database schema information
- Ask a colleague who has experience with the UMT database structure

## Schema Changes Policy

1. All schema changes must go through the migration system, never by manually modifying the database.
2. Schema changes that might affect existing data must include a data migration strategy.
3. Major schema changes should be reviewed by at least one other developer.
4. Breaking changes should be clearly documented with upgrade instructions.