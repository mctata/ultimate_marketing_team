# Enhanced Audience Segmentation & Targeting

This module provides advanced audience targeting capabilities for the Ultimate Marketing Team platform, allowing marketers to create highly targeted ad campaigns.

## Components

### AdSetDetail

The main container component that integrates all audience targeting capabilities. It provides:

- Ad set creation and management
- Real-time audience reach estimates
- A tabbed interface to access different targeting features
- Integration with the campaign management workflow

### AudienceSegment

Core component for demographic, behavioral, and interest targeting. Features include:

- **Demographic targeting**: Age ranges, gender, locations, languages, education, and more
- **Behavioral targeting**: Target users based on behaviors like shopping habits, app usage, travel frequency, etc.
- **Interest-based targeting**: Target users based on interests like sports, cooking, technology, etc.
- **Life event targeting**: Target users who have recently experienced or will soon experience specific life events

### LookalikeAudience

Component for creating lookalike audiences from existing user segments. Features include:

- Source audience selection from custom audiences
- Similarity level adjustment (1-10 scale)
- Audience size customization
- Country-specific targeting

### AudienceOverlapAnalysis

Visual analysis of audience segment overlap. Features include:

- Select multiple audiences for comparison
- Visual representation of overlap percentage and size
- Insights and recommendations based on overlap analysis

## Data Model

The audience targeting module uses TypeScript interfaces defined in `src/types/audience.ts` to ensure type safety and provide code completion:

- `Demographic`: Age, gender, location, education, etc.
- `BehavioralTarget`: User behaviors to target
- `InterestTarget`: User interests to target
- `LifeEventTarget`: Life events to target
- `DeviceTarget`: Device types, operating systems, and browsers
- `LookalikeAudienceSettings`: Settings for lookalike audience creation
- `AudienceOverlapData`: Data for audience overlap analysis
- `AudienceTarget`: Comprehensive audience targeting specification

## Services

The `audienceService` in `src/services/audienceService.ts` provides methods for:

- Getting audience data
- Fetching targeting options (behaviors, interests, life events)
- Saving audience settings
- Getting reach estimates
- Creating lookalike audiences
- Analyzing audience overlap

## Usage

The enhanced audience targeting can be accessed through the Campaign Detail page by navigating to the "Ad Sets" tab. From there, marketers can:

1. Define audience segments using demographic, behavioral, and interest targeting
2. Create lookalike audiences based on existing customer segments
3. Analyze overlap between different audience segments
4. Get real-time reach estimates for their targeting criteria

This implementation enables sophisticated targeting comparable to platforms like Facebook Ads and Google Ads, all within the Ultimate Marketing Team dashboard.
