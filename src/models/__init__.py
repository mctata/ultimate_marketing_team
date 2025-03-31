# Import all models to ensure proper SQLAlchemy mapper configuration
from src.models.project import Brand, Project, ProjectType
from src.models.competitor import Competitor, CompetitorContent
from src.models.integration import (
    SocialAccount, CMSAccount, AdAccount, EmailAccount, AnalyticsAccount, 
    ApiKey, Webhook, IntegrationHealth
)
from src.models.content import ContentDraft, ABTest, ContentCalendar, ContentPerformance
from src.models.advertising import AdCampaign, AdSet, Ad, AdPerformance
from src.models.system import User, Role, Permission, Notification, AuditLog, SystemLog
from src.models.seo import (
    SEOAuditLog, SEOContentMetrics, SEOKeywordOpportunity, 
    SEOContentUpdateRecommendation, SearchConsoleProperty
)