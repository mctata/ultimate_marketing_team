# Campaign Module Features

## Overview
The Campaign module provides comprehensive tools for managing, monitoring, and optimizing marketing campaigns. This document outlines the key features and usage instructions for developers.

## Features

### 1. Competitor Benchmark Integration

Provides detailed competitive analysis and benchmarking capabilities:

- **Share of Voice Analysis**: Visual representation of your brand's market share compared to competitors
- **Competitor Performance Comparison**: Side-by-side metrics comparison with major competitors
- **Industry Benchmark Charts**: Compare your performance against industry averages
- **Competitor Ad Feed**: Monitor and analyze competitor's advertising content

#### Implementation Details:
- Located at `/campaigns/:id/benchmark`
- Uses components:
  - `ShareOfVoiceAnalysis`
  - `CompetitorPerformanceComparison`
  - `IndustryBenchmarkChart`
  - `CompetitorAdFeed`
- Data service: `campaignBenchmarkService.ts`
- Hook: `useCampaignBenchmark.ts`

### 2. Custom Reporting Dashboard

Create, manage, and schedule custom reports:

- **Report Templates**: Use and create templates for standardized reporting
- **Scheduled Reports**: Set up automatic report generation and delivery
- **Custom Report Builder**: Create tailored reports with specific metrics
- **Export Capabilities**: Export reports in multiple formats (PDF, Excel, CSV)

#### Implementation Details:
- Located at `/campaigns/reports`
- Data service: `reportService.ts`
- Hook: `useReports.ts`
- Key components:
  - Report template management
  - Scheduling interface
  - Metric selection and configuration
  - Export format options

### 3. Campaign Performance Alerts

Proactive monitoring and notification system:

- **Threshold-based Alerts**: Create alerts for when metrics exceed or fall below targets
- **Anomaly Detection**: Automated detection of unusual campaign performance patterns
- **Alert Preferences**: Configure notification settings per metric and campaign
- **Resolution Workflow**: Track and manage alert resolution process

#### Implementation Details:
- Located at `/campaigns/:id/alerts` 
- Data service: `alertService.ts`
- Hook: `useAlerts.ts`
- Alert types supported:
  - Threshold alerts
  - Anomaly detection
  - Budget utilization
  - Performance trends

## Usage

### Navigation

Navigation to these features can be done in multiple ways:

1. From Campaign List: 
   - Custom Reports: Button in the header
   - Benchmark/Alerts: Buttons in the campaign card actions section

2. From Campaign Details:
   - Tab navigation to Benchmark, Alerts sections

3. Direct URL access:
   - `/campaigns/reports`
   - `/campaigns/:id/benchmark`
   - `/campaigns/:id/alerts`

### Development Guidelines

1. **Extending Services**:
   - Add new API endpoints to the corresponding service files
   - Update mock data generators with representative test data
   - Ensure proper typing for all data structures

2. **Adding New Components**:
   - Follow existing component patterns and naming conventions
   - Create unit tests for all new components
   - Update this documentation when adding features

3. **Backend Integration**:
   - When connecting to real APIs, update the service implementations
   - Remove mock data generators when real data is available
   - Keep API parameter and response structures consistent

## Testing

1. **Unit Tests**:
   - Components: `src/components/campaigns/__tests__/`
   - Pages: `src/pages/campaigns/__tests__/`
   - Run tests with `npm test`

2. **Manual Testing**:
   - Test navigation between features
   - Verify data loading and error states
   - Test responsive layouts on different screen sizes

## To Do

1. Connect to real API endpoints when staging environment is ready
2. Implement real data fetching in service files
3. Add more comprehensive unit tests
4. Create end-to-end tests for critical user flows