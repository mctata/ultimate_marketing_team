"""
Domain-Driven Design Implementation
This module refactors the application to follow domain-driven design principles with bounded contexts.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from typing import Any, Dict, List, Optional, Set, Type, TypeVar, Union
import uuid

# Core Domain - Shared Kernel
class Entity(ABC):
    """Base class for all entities."""
    
    @property
    @abstractmethod
    def id(self) -> str:
        """Get the entity ID."""
        ...
    
    def __eq__(self, other: Any) -> bool:
        """Check if two entities are equal based on ID."""
        if not isinstance(other, Entity):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        """Hash based on ID."""
        return hash(self.id)

class AggregateRoot(Entity):
    """Base class for all aggregate roots."""
    
    def __init__(self):
        """Initialize a new aggregate root."""
        self._domain_events: List[DomainEvent] = []
    
    @property
    def domain_events(self) -> List['DomainEvent']:
        """Get all domain events."""
        return self._domain_events.copy()
    
    def add_domain_event(self, event: 'DomainEvent') -> None:
        """Add a domain event to the aggregate."""
        self._domain_events.append(event)
    
    def clear_domain_events(self) -> None:
        """Clear all domain events."""
        self._domain_events.clear()

class ValueObject(ABC):
    """Base class for all value objects."""
    
    def __eq__(self, other: Any) -> bool:
        """Check if two value objects are equal based on all attributes."""
        if not isinstance(other, self.__class__):
            return False
        return self.__dict__ == other.__dict__
    
    def __hash__(self) -> int:
        """Hash based on all attributes."""
        return hash(tuple(sorted(self.__dict__.items())))

@dataclass
class DomainEvent:
    """Base class for all domain events."""
    
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.now)
    
    @property
    @abstractmethod
    def event_type(self) -> str:
        """Get the event type."""
        ...

# Repository interfaces
class Repository(ABC, Generic[T]):
    """Base interface for all repositories."""
    
    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[T]:
        """Get an entity by ID."""
        ...
    
    @abstractmethod
    async def save(self, entity: T) -> None:
        """Save an entity."""
        ...
    
    @abstractmethod
    async def delete(self, entity: T) -> None:
        """Delete an entity."""
        ...

# Domain Services
class DomainService(ABC):
    """Base interface for all domain services."""
    pass

# Domain Exceptions
class DomainException(Exception):
    """Base exception for all domain exceptions."""
    pass

class ValidationException(DomainException):
    """Exception raised when validation fails."""
    def __init__(self, message: str, errors: Dict[str, str] = None):
        self.errors = errors or {}
        super().__init__(message)

class BusinessRuleViolationException(DomainException):
    """Exception raised when a business rule is violated."""
    pass

class NotFoundException(DomainException):
    """Exception raised when an entity is not found."""
    pass

class ConcurrencyException(DomainException):
    """Exception raised when there is a concurrency conflict."""
    pass

# Unit of Work pattern
class UnitOfWork(ABC):
    """Interface for unit of work pattern."""
    
    @abstractmethod
    async def begin(self) -> None:
        """Begin a new transaction."""
        ...
    
    @abstractmethod
    async def commit(self) -> None:
        """Commit the transaction."""
        ...
    
    @abstractmethod
    async def rollback(self) -> None:
        """Rollback the transaction."""
        ...
    
    @abstractmethod
    async def __aenter__(self) -> 'UnitOfWork':
        """Enter context manager."""
        ...
    
    @abstractmethod
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit context manager."""
        ...

# Domain Event Dispatcher
class DomainEventDispatcher:
    """Dispatches domain events to handlers."""
    
    def __init__(self):
        """Initialize a new domain event dispatcher."""
        self._handlers: Dict[str, List[Callable[[DomainEvent], Any]]] = {}
    
    def register_handler(self, event_type: str, handler: Callable[[DomainEvent], Any]) -> None:
        """Register a handler for an event type."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
    
    async def dispatch(self, event: DomainEvent) -> None:
        """Dispatch an event to all registered handlers."""
        handlers = self._handlers.get(event.event_type, [])
        for handler in handlers:
            await handler(event)
    
    async def dispatch_events(self, events: List[DomainEvent]) -> None:
        """Dispatch multiple events."""
        for event in events:
            await self.dispatch(event)

# Generic types for repositories
T = TypeVar('T', bound=Entity)
from typing import Generic

# -----------------------------------------
# Brand Management Bounded Context
# -----------------------------------------

class BrandStatus(Enum):
    """Status of a brand."""
    ACTIVE = auto()
    INACTIVE = auto()
    PENDING = auto()
    ARCHIVED = auto()

@dataclass
class BrandStyling(ValueObject):
    """Brand styling value object."""
    
    primary_color: str
    secondary_color: str
    font_family: str
    content_tone: str
    
    def __post_init__(self):
        """Validate the brand styling."""
        if not self.primary_color:
            raise ValidationException("Primary color is required")
        if not self.secondary_color:
            raise ValidationException("Secondary color is required")
        if not self.font_family:
            raise ValidationException("Font family is required")
        if not self.content_tone:
            raise ValidationException("Content tone is required")

@dataclass
class SocialMediaAccount(ValueObject):
    """Social media account value object."""
    
    platform: str
    handle: str
    url: str
    active: bool = True

@dataclass
class Industry(ValueObject):
    """Industry value object."""
    
    name: str
    code: str

class Brand(AggregateRoot):
    """Brand entity."""
    
    def __init__(self, 
                id: str,
                name: str,
                description: str,
                industry: Industry,
                styling: BrandStyling,
                status: BrandStatus = BrandStatus.ACTIVE):
        """Initialize a new brand."""
        super().__init__()
        self._id = id
        self._name = name
        self._description = description
        self._industry = industry
        self._styling = styling
        self._status = status
        self._social_media_accounts: List[SocialMediaAccount] = []
        self._target_audience: Dict[str, str] = {}
        self._suggested_topics: List[str] = []
        self._created_at = datetime.now()
        self._updated_at = datetime.now()
    
    @property
    def id(self) -> str:
        """Get the brand ID."""
        return self._id
    
    @property
    def name(self) -> str:
        """Get the brand name."""
        return self._name
    
    @property
    def description(self) -> str:
        """Get the brand description."""
        return self._description
    
    @property
    def industry(self) -> Industry:
        """Get the brand industry."""
        return self._industry
    
    @property
    def styling(self) -> BrandStyling:
        """Get the brand styling."""
        return self._styling
    
    @property
    def status(self) -> BrandStatus:
        """Get the brand status."""
        return self._status
    
    @property
    def social_media_accounts(self) -> List[SocialMediaAccount]:
        """Get the brand social media accounts."""
        return self._social_media_accounts.copy()
    
    @property
    def target_audience(self) -> Dict[str, str]:
        """Get the brand target audience."""
        return self._target_audience.copy()
    
    @property
    def suggested_topics(self) -> List[str]:
        """Get the brand suggested topics."""
        return self._suggested_topics.copy()
    
    @property
    def created_at(self) -> datetime:
        """Get the brand creation time."""
        return self._created_at
    
    @property
    def updated_at(self) -> datetime:
        """Get the brand last update time."""
        return self._updated_at
    
    def update_name(self, name: str) -> None:
        """Update the brand name."""
        if not name:
            raise ValidationException("Brand name is required")
        
        self._name = name
        self._updated_at = datetime.now()
        self.add_domain_event(BrandUpdatedEvent(self.id, "name", name))
    
    def update_description(self, description: str) -> None:
        """Update the brand description."""
        self._description = description
        self._updated_at = datetime.now()
        self.add_domain_event(BrandUpdatedEvent(self.id, "description", description))
    
    def update_styling(self, styling: BrandStyling) -> None:
        """Update the brand styling."""
        self._styling = styling
        self._updated_at = datetime.now()
        self.add_domain_event(BrandUpdatedEvent(self.id, "styling", styling))
    
    def update_status(self, status: BrandStatus) -> None:
        """Update the brand status."""
        self._status = status
        self._updated_at = datetime.now()
        self.add_domain_event(BrandStatusChangedEvent(self.id, status))
    
    def add_social_media_account(self, account: SocialMediaAccount) -> None:
        """Add a social media account."""
        # Check if account already exists
        for existing in self._social_media_accounts:
            if existing.platform == account.platform and existing.handle == account.handle:
                raise BusinessRuleViolationException(f"Social media account already exists: {account.platform}/{account.handle}")
        
        self._social_media_accounts.append(account)
        self._updated_at = datetime.now()
        self.add_domain_event(SocialMediaAccountAddedEvent(self.id, account))
    
    def remove_social_media_account(self, platform: str, handle: str) -> None:
        """Remove a social media account."""
        for i, account in enumerate(self._social_media_accounts):
            if account.platform == platform and account.handle == handle:
                del self._social_media_accounts[i]
                self._updated_at = datetime.now()
                self.add_domain_event(SocialMediaAccountRemovedEvent(self.id, platform, handle))
                return
        
        raise NotFoundException(f"Social media account not found: {platform}/{handle}")
    
    def update_target_audience(self, target_audience: Dict[str, str]) -> None:
        """Update the target audience."""
        self._target_audience = target_audience.copy()
        self._updated_at = datetime.now()
        self.add_domain_event(BrandUpdatedEvent(self.id, "target_audience", target_audience))
    
    def update_suggested_topics(self, suggested_topics: List[str]) -> None:
        """Update the suggested topics."""
        self._suggested_topics = suggested_topics.copy()
        self._updated_at = datetime.now()
        self.add_domain_event(BrandUpdatedEvent(self.id, "suggested_topics", suggested_topics))
    
    @staticmethod
    def create(name: str, description: str, industry: Industry, styling: BrandStyling) -> 'Brand':
        """Create a new brand."""
        if not name:
            raise ValidationException("Brand name is required")
        
        brand_id = str(uuid.uuid4())
        brand = Brand(
            id=brand_id,
            name=name,
            description=description,
            industry=industry,
            styling=styling
        )
        
        brand.add_domain_event(BrandCreatedEvent(brand_id, name))
        return brand

@dataclass
class BrandCreatedEvent(DomainEvent):
    """Event raised when a brand is created."""
    
    brand_id: str
    name: str
    
    @property
    def event_type(self) -> str:
        return "brand.created"

@dataclass
class BrandUpdatedEvent(DomainEvent):
    """Event raised when a brand is updated."""
    
    brand_id: str
    field: str
    value: Any
    
    @property
    def event_type(self) -> str:
        return "brand.updated"

@dataclass
class BrandStatusChangedEvent(DomainEvent):
    """Event raised when a brand status is changed."""
    
    brand_id: str
    status: BrandStatus
    
    @property
    def event_type(self) -> str:
        return "brand.status_changed"

@dataclass
class SocialMediaAccountAddedEvent(DomainEvent):
    """Event raised when a social media account is added."""
    
    brand_id: str
    account: SocialMediaAccount
    
    @property
    def event_type(self) -> str:
        return "brand.social_media_account_added"

@dataclass
class SocialMediaAccountRemovedEvent(DomainEvent):
    """Event raised when a social media account is removed."""
    
    brand_id: str
    platform: str
    handle: str
    
    @property
    def event_type(self) -> str:
        return "brand.social_media_account_removed"

class BrandRepository(Repository[Brand]):
    """Interface for brand repository."""
    
    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[Brand]:
        """Get a brand by name."""
        ...
    
    @abstractmethod
    async def list_active(self) -> List[Brand]:
        """List all active brands."""
        ...
    
    @abstractmethod
    async def list_by_industry(self, industry_code: str) -> List[Brand]:
        """List brands by industry."""
        ...

# -----------------------------------------
# Content Management Bounded Context
# -----------------------------------------

class ContentType(Enum):
    """Type of content."""
    BLOG_POST = auto()
    SOCIAL_POST = auto()
    EMAIL = auto()
    AD = auto()
    LANDING_PAGE = auto()
    VIDEO_SCRIPT = auto()

class ContentStatus(Enum):
    """Status of content."""
    DRAFT = auto()
    REVIEW = auto()
    APPROVED = auto()
    PUBLISHED = auto()
    ARCHIVED = auto()
    REJECTED = auto()

@dataclass
class ContentPerformance(ValueObject):
    """Content performance value object."""
    
    views: int = 0
    likes: int = 0
    shares: int = 0
    comments: int = 0
    clicks: int = 0
    conversions: int = 0
    last_updated: datetime = field(default_factory=datetime.now)

@dataclass
class ContentMetadata(ValueObject):
    """Content metadata value object."""
    
    keywords: List[str] = field(default_factory=list)
    categories: List[str] = field(default_factory=list)
    target_persona: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    publish_date: Optional[datetime] = None

class Content(AggregateRoot):
    """Content entity."""
    
    def __init__(self,
                id: str,
                title: str,
                content_type: ContentType,
                brand_id: str,
                body: str,
                status: ContentStatus = ContentStatus.DRAFT,
                metadata: Optional[ContentMetadata] = None,
                author_id: Optional[str] = None):
        """Initialize new content."""
        super().__init__()
        self._id = id
        self._title = title
        self._content_type = content_type
        self._brand_id = brand_id
        self._body = body
        self._status = status
        self._metadata = metadata or ContentMetadata()
        self._author_id = author_id
        self._performance = ContentPerformance()
        self._created_at = datetime.now()
        self._updated_at = datetime.now()
        self._published_at = None
        self._version = 1
    
    @property
    def id(self) -> str:
        """Get the content ID."""
        return self._id
    
    @property
    def title(self) -> str:
        """Get the content title."""
        return self._title
    
    @property
    def content_type(self) -> ContentType:
        """Get the content type."""
        return self._content_type
    
    @property
    def brand_id(self) -> str:
        """Get the brand ID."""
        return self._brand_id
    
    @property
    def body(self) -> str:
        """Get the content body."""
        return self._body
    
    @property
    def status(self) -> ContentStatus:
        """Get the content status."""
        return self._status
    
    @property
    def metadata(self) -> ContentMetadata:
        """Get the content metadata."""
        return self._metadata
    
    @property
    def author_id(self) -> Optional[str]:
        """Get the author ID."""
        return self._author_id
    
    @property
    def performance(self) -> ContentPerformance:
        """Get the content performance metrics."""
        return self._performance
    
    @property
    def created_at(self) -> datetime:
        """Get the content creation time."""
        return self._created_at
    
    @property
    def updated_at(self) -> datetime:
        """Get the content last update time."""
        return self._updated_at
    
    @property
    def published_at(self) -> Optional[datetime]:
        """Get the content publication time."""
        return self._published_at
    
    @property
    def version(self) -> int:
        """Get the content version."""
        return self._version
    
    def update_title(self, title: str) -> None:
        """Update the content title."""
        if not title:
            raise ValidationException("Content title is required")
        
        self._title = title
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(ContentUpdatedEvent(self.id, "title", title))
    
    def update_body(self, body: str) -> None:
        """Update the content body."""
        if not body:
            raise ValidationException("Content body is required")
        
        self._body = body
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(ContentUpdatedEvent(self.id, "body", body))
    
    def update_metadata(self, metadata: ContentMetadata) -> None:
        """Update the content metadata."""
        self._metadata = metadata
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(ContentUpdatedEvent(self.id, "metadata", metadata))
    
    def update_status(self, status: ContentStatus) -> None:
        """Update the content status."""
        if self._status == status:
            return
        
        # Business rules for status transitions
        if status == ContentStatus.PUBLISHED:
            if self._status not in [ContentStatus.APPROVED, ContentStatus.ARCHIVED]:
                raise BusinessRuleViolationException("Content must be approved before publishing")
            self._published_at = datetime.now()
        
        old_status = self._status
        self._status = status
        self._updated_at = datetime.now()
        self._version += 1
        
        self.add_domain_event(ContentStatusChangedEvent(self.id, old_status, status))
        
        # Special events for certain status changes
        if status == ContentStatus.PUBLISHED:
            self.add_domain_event(ContentPublishedEvent(self.id, self._published_at))
    
    def update_performance(self, performance: ContentPerformance) -> None:
        """Update the content performance metrics."""
        self._performance = performance
        self.add_domain_event(ContentPerformanceUpdatedEvent(self.id, performance))
    
    @staticmethod
    def create(title: str, content_type: ContentType, brand_id: str, body: str, 
              author_id: Optional[str] = None, metadata: Optional[ContentMetadata] = None) -> 'Content':
        """Create new content."""
        if not title:
            raise ValidationException("Content title is required")
        if not body:
            raise ValidationException("Content body is required")
        
        content_id = str(uuid.uuid4())
        content = Content(
            id=content_id,
            title=title,
            content_type=content_type,
            brand_id=brand_id,
            body=body,
            author_id=author_id,
            metadata=metadata
        )
        
        content.add_domain_event(ContentCreatedEvent(content_id, title, content_type, brand_id))
        return content

@dataclass
class ContentCreatedEvent(DomainEvent):
    """Event raised when content is created."""
    
    content_id: str
    title: str
    content_type: ContentType
    brand_id: str
    
    @property
    def event_type(self) -> str:
        return "content.created"

@dataclass
class ContentUpdatedEvent(DomainEvent):
    """Event raised when content is updated."""
    
    content_id: str
    field: str
    value: Any
    
    @property
    def event_type(self) -> str:
        return "content.updated"

@dataclass
class ContentStatusChangedEvent(DomainEvent):
    """Event raised when content status is changed."""
    
    content_id: str
    old_status: ContentStatus
    new_status: ContentStatus
    
    @property
    def event_type(self) -> str:
        return "content.status_changed"

@dataclass
class ContentPublishedEvent(DomainEvent):
    """Event raised when content is published."""
    
    content_id: str
    published_at: datetime
    
    @property
    def event_type(self) -> str:
        return "content.published"

@dataclass
class ContentPerformanceUpdatedEvent(DomainEvent):
    """Event raised when content performance is updated."""
    
    content_id: str
    performance: ContentPerformance
    
    @property
    def event_type(self) -> str:
        return "content.performance_updated"

class ContentRepository(Repository[Content]):
    """Interface for content repository."""
    
    @abstractmethod
    async def list_by_brand(self, brand_id: str, status: Optional[ContentStatus] = None) -> List[Content]:
        """List content by brand."""
        ...
    
    @abstractmethod
    async def list_by_author(self, author_id: str) -> List[Content]:
        """List content by author."""
        ...
    
    @abstractmethod
    async def list_by_status(self, status: ContentStatus) -> List[Content]:
        """List content by status."""
        ...
    
    @abstractmethod
    async def search(self, query: str) -> List[Content]:
        """Search content."""
        ...

# -----------------------------------------
# Campaign Management Bounded Context
# -----------------------------------------

class CampaignStatus(Enum):
    """Status of a campaign."""
    DRAFT = auto()
    SCHEDULED = auto()
    ACTIVE = auto()
    PAUSED = auto()
    COMPLETED = auto()
    CANCELLED = auto()

class CampaignType(Enum):
    """Type of campaign."""
    EMAIL = auto()
    SOCIAL = auto()
    SEARCH = auto()
    DISPLAY = auto()
    VIDEO = auto()
    MULTI_CHANNEL = auto()

@dataclass
class Budget(ValueObject):
    """Budget value object."""
    
    amount: float
    currency: str = "USD"
    
    def __post_init__(self):
        """Validate the budget."""
        if self.amount < 0:
            raise ValidationException("Budget amount must be positive")

@dataclass
class DateRange(ValueObject):
    """Date range value object."""
    
    start_date: datetime
    end_date: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate the date range."""
        if self.end_date and self.start_date > self.end_date:
            raise ValidationException("Start date must be before end date")

@dataclass
class CampaignPerformance(ValueObject):
    """Campaign performance value object."""
    
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: float = 0
    revenue: float = 0
    last_updated: datetime = field(default_factory=datetime.now)
    
    @property
    def ctr(self) -> float:
        """Get click-through rate."""
        return self.clicks / self.impressions if self.impressions > 0 else 0
    
    @property
    def conversion_rate(self) -> float:
        """Get conversion rate."""
        return self.conversions / self.clicks if self.clicks > 0 else 0
    
    @property
    def roas(self) -> float:
        """Get return on ad spend."""
        return self.revenue / self.spend if self.spend > 0 else 0

class Campaign(AggregateRoot):
    """Campaign entity."""
    
    def __init__(self,
                id: str,
                name: str,
                brand_id: str,
                campaign_type: CampaignType,
                date_range: DateRange,
                status: CampaignStatus = CampaignStatus.DRAFT,
                budget: Optional[Budget] = None,
                description: Optional[str] = None):
        """Initialize a new campaign."""
        super().__init__()
        self._id = id
        self._name = name
        self._brand_id = brand_id
        self._campaign_type = campaign_type
        self._date_range = date_range
        self._status = status
        self._budget = budget
        self._description = description
        self._performance = CampaignPerformance()
        self._created_at = datetime.now()
        self._updated_at = datetime.now()
        self._content_ids: List[str] = []
        self._target_platforms: List[str] = []
        self._version = 1
    
    @property
    def id(self) -> str:
        """Get the campaign ID."""
        return self._id
    
    @property
    def name(self) -> str:
        """Get the campaign name."""
        return self._name
    
    @property
    def brand_id(self) -> str:
        """Get the brand ID."""
        return self._brand_id
    
    @property
    def campaign_type(self) -> CampaignType:
        """Get the campaign type."""
        return self._campaign_type
    
    @property
    def date_range(self) -> DateRange:
        """Get the campaign date range."""
        return self._date_range
    
    @property
    def status(self) -> CampaignStatus:
        """Get the campaign status."""
        return self._status
    
    @property
    def budget(self) -> Optional[Budget]:
        """Get the campaign budget."""
        return self._budget
    
    @property
    def description(self) -> Optional[str]:
        """Get the campaign description."""
        return self._description
    
    @property
    def performance(self) -> CampaignPerformance:
        """Get the campaign performance metrics."""
        return self._performance
    
    @property
    def created_at(self) -> datetime:
        """Get the campaign creation time."""
        return self._created_at
    
    @property
    def updated_at(self) -> datetime:
        """Get the campaign last update time."""
        return self._updated_at
    
    @property
    def content_ids(self) -> List[str]:
        """Get the campaign content IDs."""
        return self._content_ids.copy()
    
    @property
    def target_platforms(self) -> List[str]:
        """Get the campaign target platforms."""
        return self._target_platforms.copy()
    
    @property
    def version(self) -> int:
        """Get the campaign version."""
        return self._version
    
    def update_name(self, name: str) -> None:
        """Update the campaign name."""
        if not name:
            raise ValidationException("Campaign name is required")
        
        self._name = name
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(CampaignUpdatedEvent(self.id, "name", name))
    
    def update_date_range(self, date_range: DateRange) -> None:
        """Update the campaign date range."""
        self._date_range = date_range
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(CampaignUpdatedEvent(self.id, "date_range", date_range))
    
    def update_budget(self, budget: Budget) -> None:
        """Update the campaign budget."""
        self._budget = budget
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(CampaignUpdatedEvent(self.id, "budget", budget))
    
    def update_description(self, description: str) -> None:
        """Update the campaign description."""
        self._description = description
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(CampaignUpdatedEvent(self.id, "description", description))
    
    def update_status(self, status: CampaignStatus) -> None:
        """Update the campaign status."""
        if self._status == status:
            return
        
        # Business rules for status transitions
        if status == CampaignStatus.ACTIVE:
            # Ensure the campaign has a budget
            if not self._budget:
                raise BusinessRuleViolationException("Campaign must have a budget to be activated")
            
            # Ensure the campaign has content
            if not self._content_ids:
                raise BusinessRuleViolationException("Campaign must have content to be activated")
        
        old_status = self._status
        self._status = status
        self._updated_at = datetime.now()
        self._version += 1
        
        self.add_domain_event(CampaignStatusChangedEvent(self.id, old_status, status))
    
    def update_performance(self, performance: CampaignPerformance) -> None:
        """Update the campaign performance metrics."""
        self._performance = performance
        self.add_domain_event(CampaignPerformanceUpdatedEvent(self.id, performance))
    
    def add_content(self, content_id: str) -> None:
        """Add content to the campaign."""
        if content_id in self._content_ids:
            return
        
        self._content_ids.append(content_id)
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(CampaignContentAddedEvent(self.id, content_id))
    
    def remove_content(self, content_id: str) -> None:
        """Remove content from the campaign."""
        if content_id not in self._content_ids:
            return
        
        self._content_ids.remove(content_id)
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(CampaignContentRemovedEvent(self.id, content_id))
    
    def add_target_platform(self, platform: str) -> None:
        """Add a target platform to the campaign."""
        if platform in self._target_platforms:
            return
        
        self._target_platforms.append(platform)
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(CampaignUpdatedEvent(self.id, "target_platforms", self._target_platforms))
    
    def remove_target_platform(self, platform: str) -> None:
        """Remove a target platform from the campaign."""
        if platform not in self._target_platforms:
            return
        
        self._target_platforms.remove(platform)
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(CampaignUpdatedEvent(self.id, "target_platforms", self._target_platforms))
    
    @staticmethod
    def create(name: str, brand_id: str, campaign_type: CampaignType, date_range: DateRange,
              budget: Optional[Budget] = None, description: Optional[str] = None) -> 'Campaign':
        """Create a new campaign."""
        if not name:
            raise ValidationException("Campaign name is required")
        
        campaign_id = str(uuid.uuid4())
        campaign = Campaign(
            id=campaign_id,
            name=name,
            brand_id=brand_id,
            campaign_type=campaign_type,
            date_range=date_range,
            budget=budget,
            description=description
        )
        
        campaign.add_domain_event(CampaignCreatedEvent(campaign_id, name, brand_id, campaign_type))
        return campaign

@dataclass
class CampaignCreatedEvent(DomainEvent):
    """Event raised when a campaign is created."""
    
    campaign_id: str
    name: str
    brand_id: str
    campaign_type: CampaignType
    
    @property
    def event_type(self) -> str:
        return "campaign.created"

@dataclass
class CampaignUpdatedEvent(DomainEvent):
    """Event raised when a campaign is updated."""
    
    campaign_id: str
    field: str
    value: Any
    
    @property
    def event_type(self) -> str:
        return "campaign.updated"

@dataclass
class CampaignStatusChangedEvent(DomainEvent):
    """Event raised when a campaign status is changed."""
    
    campaign_id: str
    old_status: CampaignStatus
    new_status: CampaignStatus
    
    @property
    def event_type(self) -> str:
        return "campaign.status_changed"

@dataclass
class CampaignPerformanceUpdatedEvent(DomainEvent):
    """Event raised when campaign performance is updated."""
    
    campaign_id: str
    performance: CampaignPerformance
    
    @property
    def event_type(self) -> str:
        return "campaign.performance_updated"

@dataclass
class CampaignContentAddedEvent(DomainEvent):
    """Event raised when content is added to a campaign."""
    
    campaign_id: str
    content_id: str
    
    @property
    def event_type(self) -> str:
        return "campaign.content_added"

@dataclass
class CampaignContentRemovedEvent(DomainEvent):
    """Event raised when content is removed from a campaign."""
    
    campaign_id: str
    content_id: str
    
    @property
    def event_type(self) -> str:
        return "campaign.content_removed"

class CampaignRepository(Repository[Campaign]):
    """Interface for campaign repository."""
    
    @abstractmethod
    async def list_by_brand(self, brand_id: str, status: Optional[CampaignStatus] = None) -> List[Campaign]:
        """List campaigns by brand."""
        ...
    
    @abstractmethod
    async def list_active(self) -> List[Campaign]:
        """List all active campaigns."""
        ...
    
    @abstractmethod
    async def list_by_date_range(self, start_date: datetime, end_date: datetime) -> List[Campaign]:
        """List campaigns by date range."""
        ...

# -----------------------------------------
# Analytics Bounded Context
# -----------------------------------------

class AnalyticsTimeFrame(Enum):
    """Time frame for analytics."""
    DAY = auto()
    WEEK = auto()
    MONTH = auto()
    QUARTER = auto()
    YEAR = auto()
    CUSTOM = auto()

@dataclass
class AnalyticsFilter(ValueObject):
    """Analytics filter value object."""
    
    brand_ids: List[str] = field(default_factory=list)
    campaign_ids: List[str] = field(default_factory=list)
    content_ids: List[str] = field(default_factory=list)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_frame: AnalyticsTimeFrame = AnalyticsTimeFrame.MONTH
    platforms: List[str] = field(default_factory=list)
    content_types: List[ContentType] = field(default_factory=list)

@dataclass
class AnalyticsMetric(ValueObject):
    """Analytics metric value object."""
    
    name: str
    value: float
    unit: str = ""
    previous_value: Optional[float] = None
    
    @property
    def change_percentage(self) -> Optional[float]:
        """Get the change percentage."""
        if self.previous_value is None or self.previous_value == 0:
            return None
        return ((self.value - self.previous_value) / self.previous_value) * 100

@dataclass
class AnalyticsDataPoint(ValueObject):
    """Analytics data point value object."""
    
    timestamp: datetime
    metrics: Dict[str, float]

@dataclass
class AnalyticsReport(ValueObject):
    """Analytics report value object."""
    
    report_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "Analytics Report"
    description: str = ""
    filter: AnalyticsFilter = field(default_factory=AnalyticsFilter)
    metrics: Dict[str, AnalyticsMetric] = field(default_factory=dict)
    time_series: Dict[str, List[AnalyticsDataPoint]] = field(default_factory=dict)
    insights: List[str] = field(default_factory=list)
    generated_at: datetime = field(default_factory=datetime.now)

class AnalyticsService(DomainService):
    """Service for generating analytics."""
    
    @abstractmethod
    async def generate_content_performance_report(self, filter: AnalyticsFilter) -> AnalyticsReport:
        """Generate a content performance report."""
        ...
    
    @abstractmethod
    async def generate_campaign_performance_report(self, filter: AnalyticsFilter) -> AnalyticsReport:
        """Generate a campaign performance report."""
        ...
    
    @abstractmethod
    async def generate_brand_performance_report(self, filter: AnalyticsFilter) -> AnalyticsReport:
        """Generate a brand performance report."""
        ...
    
    @abstractmethod
    async def generate_custom_report(self, filter: AnalyticsFilter, metrics: List[str]) -> AnalyticsReport:
        """Generate a custom report."""
        ...

# -----------------------------------------
# Integration Bounded Context
# -----------------------------------------

class IntegrationType(Enum):
    """Type of integration."""
    SOCIAL_MEDIA = auto()
    CMS = auto()
    EMAIL = auto()
    AD_PLATFORM = auto()
    ANALYTICS = auto()

class IntegrationStatus(Enum):
    """Status of an integration."""
    ACTIVE = auto()
    INACTIVE = auto()
    ERROR = auto()
    PENDING = auto()

@dataclass
class IntegrationCredentials(ValueObject):
    """Integration credentials value object."""
    
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expiry: Optional[datetime] = None
    username: Optional[str] = None
    password: Optional[str] = None
    
    # Must not expose sensitive fields in string representation
    def __str__(self) -> str:
        return "IntegrationCredentials(***)"
    
    def __repr__(self) -> str:
        return "IntegrationCredentials(***)"

class Integration(AggregateRoot):
    """Integration entity."""
    
    def __init__(self,
                id: str,
                name: str,
                platform: str,
                integration_type: IntegrationType,
                brand_id: str,
                credentials: IntegrationCredentials,
                status: IntegrationStatus = IntegrationStatus.PENDING):
        """Initialize a new integration."""
        super().__init__()
        self._id = id
        self._name = name
        self._platform = platform
        self._integration_type = integration_type
        self._brand_id = brand_id
        self._credentials = credentials
        self._status = status
        self._configuration: Dict[str, Any] = {}
        self._last_sync: Optional[datetime] = None
        self._created_at = datetime.now()
        self._updated_at = datetime.now()
        self._version = 1
    
    @property
    def id(self) -> str:
        """Get the integration ID."""
        return self._id
    
    @property
    def name(self) -> str:
        """Get the integration name."""
        return self._name
    
    @property
    def platform(self) -> str:
        """Get the integration platform."""
        return self._platform
    
    @property
    def integration_type(self) -> IntegrationType:
        """Get the integration type."""
        return self._integration_type
    
    @property
    def brand_id(self) -> str:
        """Get the brand ID."""
        return self._brand_id
    
    @property
    def credentials(self) -> IntegrationCredentials:
        """Get the integration credentials."""
        return self._credentials
    
    @property
    def status(self) -> IntegrationStatus:
        """Get the integration status."""
        return self._status
    
    @property
    def configuration(self) -> Dict[str, Any]:
        """Get the integration configuration."""
        return self._configuration.copy()
    
    @property
    def last_sync(self) -> Optional[datetime]:
        """Get the last sync time."""
        return self._last_sync
    
    @property
    def created_at(self) -> datetime:
        """Get the integration creation time."""
        return self._created_at
    
    @property
    def updated_at(self) -> datetime:
        """Get the integration last update time."""
        return self._updated_at
    
    @property
    def version(self) -> int:
        """Get the integration version."""
        return self._version
    
    def update_credentials(self, credentials: IntegrationCredentials) -> None:
        """Update the integration credentials."""
        self._credentials = credentials
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(IntegrationUpdatedEvent(self.id, "credentials", "***"))
    
    def update_status(self, status: IntegrationStatus) -> None:
        """Update the integration status."""
        old_status = self._status
        self._status = status
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(IntegrationStatusChangedEvent(self.id, old_status, status))
    
    def update_configuration(self, configuration: Dict[str, Any]) -> None:
        """Update the integration configuration."""
        self._configuration = configuration.copy()
        self._updated_at = datetime.now()
        self._version += 1
        self.add_domain_event(IntegrationUpdatedEvent(self.id, "configuration", configuration))
    
    def record_sync(self) -> None:
        """Record a sync."""
        self._last_sync = datetime.now()
        self._updated_at = datetime.now()
        self.add_domain_event(IntegrationSyncEvent(self.id))
    
    @staticmethod
    def create(name: str, platform: str, integration_type: IntegrationType, brand_id: str, 
              credentials: IntegrationCredentials) -> 'Integration':
        """Create a new integration."""
        if not name:
            raise ValidationException("Integration name is required")
        if not platform:
            raise ValidationException("Integration platform is required")
        
        integration_id = str(uuid.uuid4())
        integration = Integration(
            id=integration_id,
            name=name,
            platform=platform,
            integration_type=integration_type,
            brand_id=brand_id,
            credentials=credentials
        )
        
        integration.add_domain_event(IntegrationCreatedEvent(integration_id, name, platform, integration_type, brand_id))
        return integration

@dataclass
class IntegrationCreatedEvent(DomainEvent):
    """Event raised when an integration is created."""
    
    integration_id: str
    name: str
    platform: str
    integration_type: IntegrationType
    brand_id: str
    
    @property
    def event_type(self) -> str:
        return "integration.created"

@dataclass
class IntegrationUpdatedEvent(DomainEvent):
    """Event raised when an integration is updated."""
    
    integration_id: str
    field: str
    value: Any  # Note: should never contain sensitive information
    
    @property
    def event_type(self) -> str:
        return "integration.updated"

@dataclass
class IntegrationStatusChangedEvent(DomainEvent):
    """Event raised when an integration status is changed."""
    
    integration_id: str
    old_status: IntegrationStatus
    new_status: IntegrationStatus
    
    @property
    def event_type(self) -> str:
        return "integration.status_changed"

@dataclass
class IntegrationSyncEvent(DomainEvent):
    """Event raised when an integration is synced."""
    
    integration_id: str
    
    @property
    def event_type(self) -> str:
        return "integration.synced"

class IntegrationRepository(Repository[Integration]):
    """Interface for integration repository."""
    
    @abstractmethod
    async def list_by_brand(self, brand_id: str) -> List[Integration]:
        """List integrations by brand."""
        ...
    
    @abstractmethod
    async def list_by_type(self, integration_type: IntegrationType) -> List[Integration]:
        """List integrations by type."""
        ...
    
    @abstractmethod
    async def get_by_platform_and_brand(self, platform: str, brand_id: str) -> Optional[Integration]:
        """Get an integration by platform and brand."""
        ...