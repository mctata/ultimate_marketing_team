import { useQuery, useMutation, useQueryClient } from 'react-query';
import alertService, {
  PerformanceAlert,
  AlertPreference,
  NotificationChannel,
} from '../services/alertService';

const useAlerts = (campaignId: string) => {
  const queryClient = useQueryClient();
  
  // Get all alerts for a campaign
  const getCampaignAlerts = () => 
    useQuery<{ data: PerformanceAlert[] }>(['campaignAlerts', campaignId], 
      () => alertService.getCampaignAlerts(campaignId), {
        refetchOnWindowFocus: false,
        enabled: !!campaignId,
      });
  
  // Get alert preferences for a specific campaign
  const getAlertPreferences = () => 
    useQuery<{ data: AlertPreference[] }>(['alertPreferences', campaignId], 
      () => alertService.getAlertPreferences(campaignId), {
        refetchOnWindowFocus: false,
        enabled: !!campaignId,
      });
  
  // Update alert preferences for a campaign
  const updateAlertPreferences = useMutation(
    (preferences: AlertPreference[]) => 
      alertService.updateAlertPreferences(campaignId, preferences),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['alertPreferences', campaignId]);
      },
    }
  );
  
  // Get all notification channels
  const getNotificationChannels = () => 
    useQuery<{ data: NotificationChannel[] }>('notificationChannels', 
      () => alertService.getNotificationChannels(), {
        refetchOnWindowFocus: false,
      });
  
  // Create a new notification channel
  const createNotificationChannel = useMutation(
    (channel: Omit<NotificationChannel, 'id'>) => 
      alertService.createNotificationChannel(channel),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notificationChannels');
      },
    }
  );
  
  // Resolve an alert
  const resolveAlert = useMutation(
    ({ alertId, notes }: { alertId: string; notes: string }) => 
      alertService.resolveAlert(alertId, notes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['campaignAlerts', campaignId]);
      },
    }
  );
  
  // Dismiss an alert
  const dismissAlert = useMutation(
    (alertId: string) => alertService.dismissAlert(alertId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['campaignAlerts', campaignId]);
      },
    }
  );
  
  // Test notification channel
  const testNotificationChannel = useMutation(
    (channelId: string) => alertService.testNotificationChannel(channelId)
  );
  
  return {
    getCampaignAlerts,
    getAlertPreferences,
    updateAlertPreferences,
    getNotificationChannels,
    createNotificationChannel,
    resolveAlert,
    dismissAlert,
    testNotificationChannel,
  };
};

export default useAlerts;