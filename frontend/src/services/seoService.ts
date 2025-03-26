import api from './api';

/**
 * Interface for SEO validation request
 */
export interface ContentSEOValidationRequest {
  content_text: string;
  content_type: string;
  title: string;
  primary_keyword: string;
  secondary_keywords?: string[];
  url?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for SEO validation response
 */
export interface ContentSEOValidationResponse {
  status: string;
  overall_score: number;
  title_validation: {
    score: number;
    issues: string[];
    suggestions: string[];
    title_length: number;
    has_primary_keyword: boolean;
  };
  structure_validation: {
    score: number;
    issues: string[];
    suggestions: string[];
    content_length: number;
    paragraph_count: number;
    avg_paragraph_length: number;
    heading_count: number;
    list_count: number;
  };
  keyword_validation: {
    score: number;
    issues: string[];
    suggestions: string[];
    primary_keyword_count: number;
    primary_keyword_density: number;
    secondary_keyword_presence: Record<string, number>;
    keyword_in_first_paragraph: boolean;
    keyword_in_headings: boolean;
  };
  readability_validation: {
    score: number;
    issues: string[];
    suggestions: string[];
    word_count: number;
    sentence_count: number;
    avg_sentence_length: number;
    complex_word_percentage: number;
    readability_score: number;
    passive_voice_count: number;
  };
  eeat_validation: {
    score: number;
    issues: string[];
    suggestions: string[];
    stat_citation_count: number;
    reference_count: number;
    expertise_signal_count: number;
  };
  url_validation?: {
    score: number;
    issues: string[];
    suggestions: string[];
    url_length: number;
  };
  recommendations: Array<{
    type: string;
    priority: number;
    issue: string;
    score_impact: number;
  }>;
}

/**
 * Interface for keyword analysis request
 */
export interface KeywordAnalysisRequest {
  keywords: string[];
  content_id?: number;
}

/**
 * Interface for keyword analysis response
 */
export interface KeywordAnalysisResponse {
  [keyword: string]: {
    primary_intent: string;
    secondary_intent: string;
    suggested_content_type: string;
    suggested_headings: string[];
    topic_clusters: string[];
    search_features: string[];
  };
}

/**
 * Interface for structured data request
 */
export interface StructuredDataRequest {
  content_text: string;
  schema_type: string;
  metadata: Record<string, any>;
}

/**
 * Interface for structured data response
 */
export interface StructuredDataResponse {
  status: string;
  schema_type: string;
  json_ld: Record<string, any>;
  json_ld_script: string;
}

/**
 * Interface for content update recommendation request
 */
export interface ContentUpdateRequest {
  content_text: string;
  content_id: number;
  content_age_days?: number;
  url?: string;
}

/**
 * Interface for search performance parameters
 */
export interface SearchPerformanceParams {
  brand_id: number;
  start_date: string;
  end_date: string;
  dimension?: string;
}

/**
 * Interface for search performance data
 */
export interface SearchPerformanceData {
  query?: string;
  page?: string;
  device?: string;
  country?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Interface for content search data
 */
export interface ContentSearchData {
  total_clicks: number;
  total_impressions: number;
  average_ctr: number;
  average_position: number;
  top_queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    position: number;
  }>;
  trends: {
    clicks: number[];
    impressions: number[];
    ctr: number[];
    position: number[];
  };
  devices: {
    MOBILE: { clicks: number; impressions: number };
    DESKTOP: { clicks: number; impressions: number };
    TABLET: { clicks: number; impressions: number };
  };
}

/**
 * Class for SEO service
 */
class SEOService {
  /**
   * Get search performance data from Google Search Console
   * @param params Search performance parameters
   * @returns Search performance data
   */
  async getSearchPerformance(params: SearchPerformanceParams): Promise<{ data: SearchPerformanceData[] }> {
    try {
      const { brand_id, start_date, end_date, dimension = 'query' } = params;
      const response = await api.get(`/seo/search-performance`, {
        params: { brand_id, start_date, end_date, dimension }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching search performance:', error);
      // Return mock data for development
      return {
        data: [
          { query: 'marketing automation', clicks: 120, impressions: 1560, ctr: 0.077, position: 3.2 },
          { query: 'email marketing tools', clicks: 95, impressions: 1230, ctr: 0.077, position: 4.5 },
          { query: 'best marketing platform', clicks: 85, impressions: 980, ctr: 0.087, position: 5.1 },
          { query: 'social media automation', clicks: 76, impressions: 1100, ctr: 0.069, position: 6.3 },
          { query: 'content marketing software', clicks: 65, impressions: 890, ctr: 0.073, position: 7.2 }
        ]
      };
    }
  }

  /**
   * Get content search data
   * @param content_id Content ID
   * @param brand_id Brand ID
   * @returns Content search data
   */
  async getContentSearchData(content_id: number, brand_id: number): Promise<{ data: ContentSearchData }> {
    try {
      const response = await api.get(`/seo/content/${content_id}/search-data`, {
        params: { brand_id }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching content search data:', error);
      // Return mock data for development
      return {
        data: {
          total_clicks: 320,
          total_impressions: 4150,
          average_ctr: 0.077,
          average_position: 6.3,
          top_queries: [
            { query: 'content marketing examples', clicks: 48, impressions: 580, position: 4.2 },
            { query: 'effective content strategy', clicks: 35, impressions: 490, position: 5.1 },
            { query: 'content optimization tips', clicks: 29, impressions: 420, position: 6.3 }
          ],
          trends: {
            clicks: [25, 28, 32, 35, 38, 42, 45],
            impressions: [320, 350, 380, 410, 450, 480, 510],
            ctr: [0.078, 0.08, 0.084, 0.085, 0.084, 0.088, 0.088],
            position: [7.2, 7.0, 6.8, 6.5, 6.3, 6.0, 5.8]
          },
          devices: {
            MOBILE: { clicks: 180, impressions: 2350 },
            DESKTOP: { clicks: 110, impressions: 1450 },
            TABLET: { clicks: 30, impressions: 350 }
          }
        }
      };
    }
  }

  /**
   * Get keyword opportunities for content
   * @param content_id Content ID
   * @param brand_id Brand ID
   * @returns Keyword opportunities
   */
  async getKeywordOpportunities(content_id: number, brand_id: number): Promise<any> {
    try {
      const response = await api.get(`/seo/content/${content_id}/keyword-opportunities`, {
        params: { brand_id }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching keyword opportunities:', error);
      // Return mock data for development
      return {
        opportunities: [
          {
            keyword: 'marketing automation strategies',
            current_ranking: null,
            search_volume: 2900,
            competition: 'MEDIUM',
            opportunity_score: 85,
            recommended_action: 'Create new content targeting this keyword'
          },
          {
            keyword: 'email marketing best practices',
            current_ranking: 12,
            search_volume: 3500,
            competition: 'HIGH',
            opportunity_score: 78,
            recommended_action: 'Optimize existing content to improve ranking'
          },
          {
            keyword: 'social media content calendar',
            current_ranking: 18,
            search_volume: 2200,
            competition: 'MEDIUM',
            opportunity_score: 82,
            recommended_action: 'Create supporting content and internal links'
          }
        ]
      };
    }
  }

  /**
   * Analyze search intent for keywords
   * @param request Keyword analysis request
   * @returns Analysis of search intent for each keyword
   */
  async analyzeSearchIntent(request: KeywordAnalysisRequest): Promise<KeywordAnalysisResponse> {
    try {
      const response = await api.post('/seo/analyze-search-intent', request);
      return response.data.keyword_analysis;
    } catch (error) {
      console.error('Error analyzing search intent:', error);
      // Return mock data for development
      return {
        'content marketing': {
          primary_intent: 'informational',
          secondary_intent: 'commercial',
          suggested_content_type: 'article',
          suggested_headings: ['Introduction', 'What is Content Marketing', 'Benefits', 'Best Practices', 'Examples'],
          topic_clusters: ['digital marketing', 'content strategy', 'SEO', 'social media marketing'],
          search_features: ['featured_snippet']
        }
      };
    }
  }

  /**
   * Validate content for SEO best practices
   * @param request Content validation request
   * @returns Validation results
   */
  async validateContent(request: ContentSEOValidationRequest): Promise<ContentSEOValidationResponse> {
    try {
      const response = await api.post('/seo/validate-content', request);
      return response.data;
    } catch (error) {
      console.error('Error validating content:', error);
      // Return mock validation response for development
      return {
        status: 'success',
        overall_score: 78,
        title_validation: {
          score: 80,
          issues: ['Title is too short (under 30 characters)'],
          suggestions: ['Extend title to 50-60 characters for optimal display in search results'],
          title_length: 25,
          has_primary_keyword: true
        },
        structure_validation: {
          score: 75,
          issues: ['Not enough section headings'],
          suggestions: [
            'Add more headings to structure your content (at least one heading for every 300-400 words)',
            'Consider adding bulleted or numbered lists to improve scannability'
          ],
          content_length: 1200,
          paragraph_count: 8,
          avg_paragraph_length: 150,
          heading_count: 2,
          list_count: 0
        },
        keyword_validation: {
          score: 85,
          issues: [],
          suggestions: ['Include primary keyword in at least one heading'],
          primary_keyword_count: 5,
          primary_keyword_density: 1.2,
          secondary_keyword_presence: { 'digital marketing': 2, 'content strategy': 1 },
          keyword_in_first_paragraph: true,
          keyword_in_headings: false
        },
        readability_validation: {
          score: 90,
          issues: [],
          suggestions: ['Reduce use of passive voice for more engaging content'],
          word_count: 1200,
          sentence_count: 45,
          avg_sentence_length: 18,
          complex_word_percentage: 15,
          readability_score: 65,
          passive_voice_count: 8
        },
        eeat_validation: {
          score: 60,
          issues: ['Limited data citations or statistics', 'Limited external references'],
          suggestions: [
            'Include more statistics, studies, or data points to enhance E-E-A-T signals',
            'Include more references to authoritative sources to improve trustworthiness'
          ],
          stat_citation_count: 1,
          reference_count: 1,
          expertise_signal_count: 2
        },
        recommendations: [
          {
            type: 'structure_improvement',
            priority: 2,
            issue: 'Not enough section headings',
            score_impact: 25
          },
          {
            type: 'eeat_improvement',
            priority: 2,
            issue: 'Limited data citations or statistics',
            score_impact: 40
          },
          {
            type: 'eeat_improvement',
            priority: 2,
            issue: 'Limited external references',
            score_impact: 40
          },
          {
            type: 'title_optimization',
            priority: 3,
            issue: 'Title is too short (under 30 characters)',
            score_impact: 20
          }
        ]
      };
    }
  }

  /**
   * Generate structured data markup for content
   * @param request Structured data request
   * @returns Generated structured data
   */
  async generateStructuredData(request: StructuredDataRequest): Promise<StructuredDataResponse> {
    try {
      const response = await api.post('/seo/structured-data', request);
      return response.data;
    } catch (error) {
      console.error('Error generating structured data:', error);
      // Return mock structured data for development
      return {
        status: 'success',
        schema_type: request.schema_type,
        json_ld: {
          '@context': 'https://schema.org',
          '@type': request.schema_type,
          headline: request.metadata.title || '',
          description: request.metadata.description || '',
          author: {
            '@type': 'Person',
            name: request.metadata.author?.name || ''
          },
          datePublished: request.metadata.datePublished || new Date().toISOString()
        },
        json_ld_script: `<script type="application/ld+json">${JSON.stringify(
          {
            '@context': 'https://schema.org',
            '@type': request.schema_type,
            headline: request.metadata.title || '',
            description: request.metadata.description || '',
            author: {
              '@type': 'Person',
              name: request.metadata.author?.name || ''
            },
            datePublished: request.metadata.datePublished || new Date().toISOString()
          },
          null,
          2
        )}</script>`
      };
    }
  }

  /**
   * Detect best schema type for content
   * @param content Content object with text and title
   * @returns Recommended schema type
   */
  async detectSchemaType(content: { text: string; title: string }): Promise<any> {
    try {
      const response = await api.post('/seo/detect-schema-type', content);
      return response.data;
    } catch (error) {
      console.error('Error detecting schema type:', error);
      // Return mock schema detection for development
      return {
        status: 'success',
        recommended_schema: 'BlogPosting',
        confidence: 80,
        scores: {
          HowTo: 20,
          FAQPage: 10,
          Product: 5,
          BlogPosting: 80,
          Article: 60
        }
      };
    }
  }

  /**
   * Get indexation status for a URL
   * @param brand_id Brand ID
   * @param url URL to check
   * @returns Indexation status
   */
  async getIndexationStatus(brand_id: number, url: string): Promise<any> {
    try {
      const response = await api.get('/seo/indexation-status', {
        params: { brand_id, url }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking indexation status:', error);
      // Return mock indexation status for development
      return {
        status: 'success',
        url,
        is_indexed: true,
        indexing_state: 'INDEXED',
        last_crawled: '2025-03-22T14:35:12Z',
        sitemap: 'https://example.com/sitemap.xml',
        mobile_usability: 'USABLE',
        enhancements: {
          mobile_usability: {
            status: 'VALID',
            issues: []
          },
          structured_data: {
            status: 'VALID',
            detected_items: ['Article', 'BreadcrumbList']
          }
        }
      };
    }
  }

  /**
   * Get mobile usability status for a URL
   * @param brand_id Brand ID
   * @param url URL to check
   * @returns Mobile usability status
   */
  async getMobileUsability(brand_id: number, url: string): Promise<any> {
    try {
      const response = await api.get('/seo/mobile-usability', {
        params: { brand_id, url }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking mobile usability:', error);
      // Return mock mobile usability for development
      return {
        status: 'success',
        url,
        usability_status: 'USABLE',
        issues: [],
        last_checked: '2025-03-24T09:15:43Z',
        screenshot: 'https://example.com/screenshots/mobile_123.png',
        device_tested: 'Smartphone'
      };
    }
  }

  /**
   * Get declining rankings for content
   * @param content_id Content ID
   * @param brand_id Brand ID
   * @returns Declining rankings
   */
  async getDecliningRankings(content_id: number, brand_id: number): Promise<any> {
    try {
      const response = await api.get(`/seo/content/${content_id}/declining-rankings`, {
        params: { brand_id }
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting declining rankings:', error);
      // Return mock declining rankings for development
      return {
        status: 'success',
        declining_keywords: [
          {
            query: 'marketing automation tools',
            current_position: 8.3,
            previous_position: 5.1,
            position_change: 3.2,
            clicks_change_pct: -25,
            impressions: 580
          },
          {
            query: 'best email marketing software',
            current_position: 15.2,
            previous_position: 11.4,
            position_change: 3.8,
            clicks_change_pct: -35,
            impressions: 410
          }
        ]
      };
    }
  }

  /**
   * Analyze content performance
   * @param request Content update request
   * @param brand_id Brand ID
   * @returns Performance analysis
   */
  async analyzeContentPerformance(request: ContentUpdateRequest, brand_id: number): Promise<any> {
    try {
      const response = await api.post('/seo/content/analyze-performance', request, {
        params: { brand_id }
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing content performance:', error);
      // Return mock performance analysis for development
      return {
        status: 'success',
        performance_overview: {
          average_position: 6.3,
          total_clicks: 320,
          total_impressions: 4150,
          average_ctr: 0.077,
          trend: {
            clicks: 'stable',
            impressions: 'stable',
            position: 'declining'
          }
        },
        performance_issues: [
          {
            type: 'declining_rankings',
            description: 'Rankings have declined over time',
            severity: 'high'
          }
        ],
        performance_insights: [
          {
            insight: 'Your content is ranking lower than before',
            action: 'Review competing content and update your content to be more comprehensive'
          },
          {
            insight: 'Content structure could be improved',
            action: 'Add more headings to organize content and improve readability'
          }
        ]
      };
    }
  }

  /**
   * Get content update recommendations
   * @param request Content update request
   * @param brand_id Brand ID
   * @returns Update recommendations
   */
  async getContentUpdateRecommendations(request: ContentUpdateRequest, brand_id: number): Promise<any> {
    try {
      const response = await api.post('/seo/content/update-recommendations', request, {
        params: { brand_id }
      });
      return response.data;
    } catch (error) {
      console.error('Error generating update recommendations:', error);
      // Return mock update recommendations for development
      return {
        status: 'success',
        content_id: request.content_id,
        recommendations: [
          {
            type: 'content_length',
            recommendation: 'Expand content length',
            details: 'Increase content length to 1500+ words for better topical coverage',
            priority: 1
          },
          {
            type: 'headings',
            recommendation: 'Add more section headings',
            details: 'Structure content with more headings (H2, H3) to improve organization',
            priority: 2
          },
          {
            type: 'missing_keyword',
            recommendation: "Add the keyword 'content marketing strategy'",
            details: "Include 'content marketing strategy' in content, preferably in a heading and early paragraph",
            priority: 1
          }
        ]
      };
    }
  }

  /**
   * Get content update schedule
   * @param content_id Content ID
   * @param brand_id Brand ID
   * @param content_age_days Content age in days
   * @returns Update schedule
   */
  async getContentUpdateSchedule(content_id: number, brand_id: number, content_age_days: number): Promise<any> {
    try {
      const response = await api.get(`/seo/content/${content_id}/update-schedule`, {
        params: { brand_id, content_age_days }
      });
      return response.data;
    } catch (error) {
      console.error('Error suggesting update schedule:', error);
      // Return mock update schedule for development
      return {
        status: 'success',
        content_id,
        content_age_days,
        update_urgency: 'medium',
        next_update_date: '2025-04-25',
        update_schedule: [
          { type: 'moderate_update', scheduled_date: '2025-04-25', priority: 'medium' },
          { type: 'performance_review', scheduled_date: '2025-06-24', priority: 'medium' }
        ]
      };
    }
  }
}

export default new SEOService();