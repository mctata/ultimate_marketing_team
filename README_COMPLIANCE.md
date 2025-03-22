# Ultimate Marketing Team - Compliance Features

This repository contains comprehensive data retention and compliance features for the Ultimate Marketing Team platform.

## Features

### Data Retention
- **Configurable retention periods** for different data types
- **Automated data archiving** procedures
- **Secure data deletion** processes
- **Audit logging** for retention activities
- **Retention policy templates** for different compliance regimes

### Compliance
- **GDPR compliance** features (right to access, right to be forgotten)
- **CCPA/CPRA compliance** features
- **International privacy regulations** support
- **Data processing agreements** management
- **Compliance reporting** capabilities
- **Consent management** for data collection

### Data Security
- **Field-level encryption** for sensitive data
- **Data classification** tagging
- **Access controls** based on data sensitivity
- **Data masking** for non-privileged users
- **Secure data transmission** protocols

### Data Export and Portability
- **Standardized data export formats**
- **Batch export** capabilities
- **Schedulable data exports**
- **API endpoints** for programmatic data retrieval
- **Data migration tools** between systems

### Privacy Controls
- **Privacy impact assessment** tools
- **Data processing documentation**
- **Data flow visualization**
- **Purpose limitation** enforcement
- **Data minimization** capabilities

## Setup

### Database Migrations

Apply the database migrations to create the necessary tables:

```bash
python manage_migrations.py upgrade
```

### Seed Data

Load initial compliance data:

```bash
psql -d ultimate_marketing_team -f scripts/seed_compliance_data.sql
```

## Usage

### Running Data Retention

To execute data retention policies:

```bash
# Process all entity types
./scripts/retention.sh

# Process a specific entity type
./scripts/retention.sh -t user
```

### Exporting User Data

To export data for a data subject access request:

```bash
python scripts/export_user_data.py --request-id 123 --format json
```

### API Endpoints

The compliance API endpoints are available at:

```
/api/v1/compliance/retention/policies  # Data retention policies
/api/v1/compliance/consent             # Consent management
/api/v1/compliance/data-requests       # Data subject requests
/api/v1/compliance/documents           # Compliance documents
/api/v1/compliance/classifications     # Data classifications
```

## Documentation

For more detailed information, see the following documentation:

- [Compliance Features](docs/COMPLIANCE.md) - Detailed documentation of all compliance features
- [API Documentation](docs/API.md) - API reference for compliance endpoints
- [Security Model](docs/SECURITY.md) - Security features and encryption details

## Testing

Run compliance-specific tests:

```bash
python -m pytest tests/compliance/
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.