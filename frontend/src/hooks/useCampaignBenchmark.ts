import { useQuery, useMutation, useQueryClient } from 'react-query';
import campaignBenchmarkService, {
  ShareOfVoiceData,
  CompetitorAdData,
  CompetitorPerformanceData,
  IndustryBenchmarkData,
} from '../services/campaignBenchmarkService';

const useCampaignBenchmark = (campaignId: string) => {
  const queryClient = useQueryClient();
  
  // Get share of voice data
  const getShareOfVoice = () => 
    useQuery<{ data: ShareOfVoiceData[] }>(['campaignBenchmark', campaignId, 'shareOfVoice'], 
      () => campaignBenchmarkService.getShareOfVoice(campaignId), {
        refetchOnWindowFocus: false,
        enabled: !!campaignId,
      });
  
  // Get competitor ads
  const getCompetitorAds = () => 
    useQuery<{ data: CompetitorAdData[] }>(['campaignBenchmark', campaignId, 'competitorAds'], 
      () => campaignBenchmarkService.getCompetitorAds(campaignId), {
        refetchOnWindowFocus: false,
        enabled: !!campaignId,
      });
  
  // Get competitor performance comparison
  const getCompetitorPerformance = () => 
    useQuery<{ data: CompetitorPerformanceData[] }>(['campaignBenchmark', campaignId, 'competitorPerformance'], 
      () => campaignBenchmarkService.getCompetitorPerformance(campaignId), {
        refetchOnWindowFocus: false,
        enabled: !!campaignId,
      });
  
  // Get industry benchmark data
  const getIndustryBenchmark = (metric: string, timeframe: string) => 
    useQuery<{ data: IndustryBenchmarkData }>(['campaignBenchmark', campaignId, 'industryBenchmark', metric, timeframe], 
      () => campaignBenchmarkService.getIndustryBenchmark(campaignId, metric, timeframe), {
        refetchOnWindowFocus: false,
        enabled: !!campaignId && !!metric && !!timeframe,
      });
  
  return {
    getShareOfVoice,
    getCompetitorAds,
    getCompetitorPerformance,
    getIndustryBenchmark,
  };
};

export default useCampaignBenchmark;