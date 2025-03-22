# Incident Post-Mortem Template

## Incident Information

| Field           | Value                                     |
|-----------------|-------------------------------------------|
| **Incident ID** | INC-YYYY-MM-DD-NN                         |
| **Date**        | YYYY-MM-DD                                |
| **Time**        | HH:MM - HH:MM UTC                         |
| **Duration**    | X hours, Y minutes                        |
| **Severity**    | P1 (Critical) / P2 (High) / P3 (Medium) / P4 (Low) |
| **Status**      | Resolved / Mitigated / Ongoing            |
| **Reporter**    | Name                                      |
| **Owner**       | Name                                      |
| **Services Affected** | List of affected services           |

## Executive Summary

Brief summary of the incident, including the impact on users, customers, and business operations.

## Timeline

| Time (UTC)  | Event                                        | Actions Taken                         |
|-------------|----------------------------------------------|--------------------------------------|
| YYYY-MM-DD HH:MM | Initial alert triggered | Monitoring system detected abnormal behavior |
| YYYY-MM-DD HH:MM | Incident declared | On-call engineer acknowledged the alert |
| YYYY-MM-DD HH:MM | Investigation started | Team assembled in incident channel |
| YYYY-MM-DD HH:MM | Root cause identified | Determined that X was causing Y |
| YYYY-MM-DD HH:MM | Mitigation applied | Deployed fix Z |
| YYYY-MM-DD HH:MM | Service restored | Confirmed normal operation |
| YYYY-MM-DD HH:MM | Incident resolved | All monitoring systems back to normal |

## Root Cause Analysis

Detailed technical explanation of what went wrong, including:
- The sequence of events that led to the incident
- Systems and components involved
- Specific triggers or conditions
- Underlying vulnerabilities or issues

## Impact Assessment

| Metric                  | Impact                                    |
|-------------------------|-------------------------------------------|
| **Users Affected**      | Number or percentage                      |
| **API Errors**          | Count or rate                             |
| **Failed Transactions** | Count                                     |
| **Revenue Impact**      | Estimated financial impact if applicable  |
| **SLA Violations**      | Which SLAs were breached                  |
| **Availability Impact** | Percentage of service degradation         |

## Mitigation Steps Taken

1. Immediate actions taken to restore service
2. Temporary workarounds implemented
3. Communication to stakeholders
4. Monitoring adjustments made

## Prevention Analysis

### What Went Well
- List of things that worked as expected during incident response
- Monitoring systems that properly detected the issue
- Processes that helped resolve the incident efficiently

### What Went Wrong
- List of failures in systems, processes, or procedures
- Missing monitoring or alerting
- Communication issues
- Knowledge gaps

### What Was Lucky
- Fortunate circumstances that limited the impact
- Coincidental factors that helped resolve the issue faster

## Action Items

| ID | Action Item | Type | Owner | Due Date | Status |
|----|-------------|------|-------|----------|--------|
| AI-01 | Implement additional monitoring for X | Prevention | Name | YYYY-MM-DD | Open |
| AI-02 | Update runbook for component Y | Process | Name | YYYY-MM-DD | Open |
| AI-03 | Add circuit breaker to Z service | Technical | Name | YYYY-MM-DD | Open |
| AI-04 | Conduct training on new alert response procedure | Knowledge | Name | YYYY-MM-DD | Open |

## Lessons Learned

Key takeaways from the incident that should inform future development, operations, and incident response procedures.

## Appendix

### Monitoring Data

Relevant charts, graphs, and monitoring data that help illustrate the incident.

### Log Snippets

```
Relevant log entries showing the error conditions
```

### Related Incidents

Links to any related or similar past incidents.

### References

- Links to relevant documentation, code repositories, or external resources
- Incident management tools and dashboards used
- Communication channels and status pages