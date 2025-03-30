# Documentation

This directory contains all project documentation, organized into logical sections.

## Directory Structure

- `/api/`: API documentation
  - `api_documentation.md`: General API documentation
  - `content_generation_api.md`: Content generation API specifications
  - `/guides/`: API usage guides for specific features
  - `openapi.yaml`: OpenAPI specification
  - `swagger.html` & `redoc.html`: API reference documentation

- `/compliance/`: Compliance documentation
  - `COMPLIANCE.md`: Compliance guidelines and documentation
  - `COMPLIANCE_TESTING.md`: Compliance testing procedures
  - `README_COMPLIANCE.md`: Overview of compliance requirements

- `/deployment/`: Deployment documentation
  - `DEPLOYMENT_GUIDE.md`: Comprehensive deployment instructions for all environments
  - `POSTGRES_CONFIG.md`: PostgreSQL 17 configuration with vector extension
  - `SSL_WORKFLOW.md`: SSL certificate configuration and management

- `/guides/`: General developer guides
  - `developer_guide.md`: General developer guidelines and project overview

- `/incident-management/`: Incident response documentation
  - `incident-response-playbook.md`: Incident response procedures
  - `post-mortem-template.md`: Post-mortem report template

- `/logging/`: Logging system documentation
  - `LOGGING_IMPROVEMENTS.md`: Logging system improvements
  - `LOGGING_SYSTEM.md`: Overview of the logging system
  - `LOG_ROTATION.md`: Log rotation policies and implementation
  - `CI_CD_LOG_INTEGRATION.md`: CI/CD integration with logging

- `/operations/`: Operations documentation
  - `SCRIPTS.md`: Available scripts and utilities
  - `slo-definitions.md`: Service Level Objectives

- `/optimization/`: Performance optimization documentation
  - `OPTIMIZATION_SUMMARY.md`: Optimization summary

- `/pr-templates/`: Pull request templates and guides
  - `PR_INSTRUCTIONS.md`: PR submission guidelines
  - `pr_template.md`: General PR template
  - `log_ci_integration_pr_template.md`: CI integration PR template
  - `log_rotation_pr_template.md`: Log rotation PR template

- `/security/`: Security documentation
  - `SECURITY_BEST_PRACTICES.md`: Security best practices

- `/seo/`: SEO module documentation
  - `README_SEO_MODULE.md`: Documentation for SEO features and Google Search Console integration

- `/setup/`: Environment setup documentation
  - `STAGING_SETUP.md`: Detailed guide for setting up staging environment

## Documentation Guidelines

1. Keep documentation in the appropriate directory based on its category
2. Update feature documentation when implementing significant changes
3. Include clear, step-by-step instructions for complex processes
4. Add code examples whenever appropriate
5. Include diagrams for complex architectures or workflows
6. Cross-reference related documentation when applicable