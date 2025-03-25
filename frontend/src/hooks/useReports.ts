import { useQuery, useMutation, useQueryClient } from 'react-query';
import reportService, {
  ReportTemplate,
  ScheduledReport,
  SavedReport,
  ReportMetric,
} from '../services/reportService';

const useReports = () => {
  const queryClient = useQueryClient();
  
  // Get all report templates
  const getReportTemplates = () => 
    useQuery<{ data: ReportTemplate[] }>('reportTemplates', 
      () => reportService.getReportTemplates(), {
        refetchOnWindowFocus: false,
      });
  
  // Get a specific report template
  const getReportTemplate = (templateId: string) => 
    useQuery<{ data: ReportTemplate }>(['reportTemplate', templateId], 
      () => reportService.getReportTemplate(templateId), {
        refetchOnWindowFocus: false,
        enabled: !!templateId,
      });
  
  // Create a new report template
  const createReportTemplate = useMutation(
    (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'usageCount'>) => 
      reportService.createReportTemplate(template),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reportTemplates');
      },
    }
  );
  
  // Get all scheduled reports
  const getScheduledReports = () => 
    useQuery<{ data: ScheduledReport[] }>('scheduledReports', 
      () => reportService.getScheduledReports(), {
        refetchOnWindowFocus: false,
      });
  
  // Create a new scheduled report
  const createScheduledReport = useMutation(
    (report: Omit<ScheduledReport, 'id' | 'createdAt' | 'lastDelivery'>) => 
      reportService.createScheduledReport(report),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('scheduledReports');
      },
    }
  );
  
  // Get all saved reports
  const getSavedReports = () => 
    useQuery<{ data: SavedReport[] }>('savedReports', 
      () => reportService.getSavedReports(), {
        refetchOnWindowFocus: false,
      });
  
  // Get all available metrics for reports
  const getAvailableMetrics = () => 
    useQuery<{ data: ReportMetric[] }>('reportMetrics', 
      () => reportService.getAvailableMetrics(), {
        refetchOnWindowFocus: false,
      });
  
  // Generate a report based on template
  const generateReport = useMutation(
    ({ templateId, params }: { templateId: string; params: any }) => 
      reportService.generateReport(templateId, params)
  );
  
  // Export a saved report
  const exportReport = useMutation(
    ({ reportId, format }: { reportId: string; format: string }) => 
      reportService.exportReport(reportId, format)
  );
  
  return {
    getReportTemplates,
    getReportTemplate,
    createReportTemplate,
    getScheduledReports,
    createScheduledReport,
    getSavedReports,
    getAvailableMetrics,
    generateReport,
    exportReport,
  };
};

export default useReports;