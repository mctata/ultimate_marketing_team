"""
Domain-driven design implementation for the Ultimate Marketing Team platform.

This module implements domain-driven design principles for the platform,
including base classes for Entity, AggregateRoot, ValueObject, and DomainEvent,
as well as implementations of the bounded contexts.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set, TypeVar, Union, Generic
import uuid
import copy

# Base DDD classes

class ValueObject:
    """Base class for value objects."""
    
    def __eq__(self, other: Any) -> bool:
        """Check if the other object is equal to this one."""
        if not isinstance(other, self.__class__):
            return False
        return self.__dict__ == other.__dict__
    
    def __hash__(self) -> int:
        """Get a hash of this object's attributes."""
        return hash(tuple(sorted(self.__dict__.items())))


class Entity(ABC):
    """Base class for entities."""
    
    def __init__(self, entity_id: str) -> None:
        """
        Initialize a new entity.
        
        Args:
            entity_id: Unique identifier for the entity
        """
        self._id = entity_id
        self._created_at = datetime.utcnow()
        self._updated_at = self._created_at
    
    @property
    def id(self) -> str:
        """Get the entity ID."""
        return self._id
    
    @property
    def created_at(self) -> datetime:
        """Get the entity creation timestamp."""
        return self._created_at
    
    @property
    def updated_at(self) -> datetime:
        """Get the entity last update timestamp."""
        return self._updated_at
    
    def _mark_updated(self) -> None:
        """Mark the entity as updated."""
        self._updated_at = datetime.utcnow()
    
    def __eq__(self, other: Any) -> bool:
        """Check if the other entity has the same ID."""
        if not isinstance(other, Entity):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        """Get a hash of the entity ID."""
        return hash(self.id)


T = TypeVar('T', bound=Entity)

class AggregateRoot(Entity):
    """Base class for aggregate roots."""
    
    def __init__(self, entity_id: str) -> None:
        """
        Initialize a new aggregate root.
        
        Args:
            entity_id: Unique identifier for the aggregate root
        """
        super().__init__(entity_id)
        self._domain_events: List[DomainEvent] = []
    
    def add_domain_event(self, event: 'DomainEvent') -> None:
        """
        Add a domain event.
        
        Args:
            event: Domain event to add
        """
        self._domain_events.append(event)
    
    def clear_domain_events(self) -> List['DomainEvent']:
        """
        Clear domain events.
        
        Returns:
            List of domain events that were cleared
        """
        events = copy.copy(self._domain_events)
        self._domain_events.clear()
        return events


class DomainEvent:
    """Base class for domain events."""
    
    def __init__(
        self,
        event_id: Optional[str] = None,
        aggregate_id: Optional[str] = None,
        aggregate_type: Optional[str] = None,
        occurred_at: Optional[datetime] = None,
    ) -> None:
        """
        Initialize a new domain event.
        
        Args:
            event_id: Unique identifier for the event
            aggregate_id: ID of the aggregate that triggered the event
            aggregate_type: Type of the aggregate that triggered the event
            occurred_at: Timestamp when the event occurred
        """
        self._event_id = event_id or str(uuid.uuid4())
        self._aggregate_id = aggregate_id
        self._aggregate_type = aggregate_type
        self._occurred_at = occurred_at or datetime.utcnow()
    
    @property
    def event_id(self) -> str:
        """Get the event ID."""
        return self._event_id
    
    @property
    def aggregate_id(self) -> Optional[str]:
        """Get the aggregate ID."""
        return self._aggregate_id
    
    @property
    def aggregate_type(self) -> Optional[str]:
        """Get the aggregate type."""
        return self._aggregate_type
    
    @property
    def occurred_at(self) -> datetime:
        """Get the event occurrence timestamp."""
        return self._occurred_at


class Repository(Generic[T], ABC):
    """Base class for repositories."""
    
    @abstractmethod
    def get_by_id(self, entity_id: str) -> Optional[T]:
        """
        Get an entity by ID.
        
        Args:
            entity_id: ID of the entity to get
            
        Returns:
            The entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    def save(self, entity: T) -> T:
        """
        Save an entity.
        
        Args:
            entity: Entity to save
            
        Returns:
            The saved entity
        """
        pass
    
    @abstractmethod
    def delete(self, entity: T) -> None:
        """
        Delete an entity.
        
        Args:
            entity: Entity to delete
        """
        pass


class DomainEventPublisher:
    """Publisher for domain events."""
    
    @staticmethod
    def publish(events: List[DomainEvent]) -> None:
        """
        Publish domain events.
        
        Args:
            events: Domain events to publish
        """
        # Actual implementation would use a message broker
        for event in events:
            print(f"Publishing event: {event.__class__.__name__} ({event.event_id})")


# Brand bounded context

class Industry(ValueObject):
    """Industry value object."""
    
    def __init__(
        self,
        name: str,
        vertical: str,
        competitive_index: float,
    ) -> None:
        """
        Initialize a new industry.
        
        Args:
            name: Industry name
            vertical: Industry vertical
            competitive_index: Industry competition index (0.0-1.0)
        """
        self.name = name
        self.vertical = vertical
        self.competitive_index = competitive_index


class BrandColor(ValueObject):
    """Brand color value object."""
    
    def __init__(
        self,
        primary: str,
        secondary: str,
        accent: Optional[str] = None,
    ) -> None:
        """
        Initialize a new brand color.
        
        Args:
            primary: Primary brand color (hex)
            secondary: Secondary brand color (hex)
            accent: Accent brand color (hex)
        """
        self.primary = primary
        self.secondary = secondary
        self.accent = accent


class StylingProperties(ValueObject):
    """Brand styling properties value object."""
    
    def __init__(
        self,
        colors: BrandColor,
        font_primary: str,
        font_secondary: Optional[str] = None,
        logo_url: Optional[str] = None,
    ) -> None:
        """
        Initialize new styling properties.
        
        Args:
            colors: Brand colors
            font_primary: Primary font family
            font_secondary: Secondary font family
            logo_url: URL to the brand logo
        """
        self.colors = colors
        self.font_primary = font_primary
        self.font_secondary = font_secondary
        self.logo_url = logo_url


class BrandCreatedEvent(DomainEvent):
    """Event for when a brand is created."""
    
    def __init__(
        self,
        brand_id: str,
        name: str,
        industry: Industry,
    ) -> None:
        """
        Initialize a new brand created event.
        
        Args:
            brand_id: ID of the brand that was created
            name: Name of the brand
            industry: Industry of the brand
        """
        super().__init__(
            aggregate_id=brand_id,
            aggregate_type="Brand",
        )
        self.name = name
        self.industry = industry


class BrandUpdatedEvent(DomainEvent):
    """Event for when a brand is updated."""
    
    def __init__(
        self,
        brand_id: str,
        updated_fields: List[str],
    ) -> None:
        """
        Initialize a new brand updated event.
        
        Args:
            brand_id: ID of the brand that was updated
            updated_fields: Fields that were updated
        """
        super().__init__(
            aggregate_id=brand_id,
            aggregate_type="Brand",
        )
        self.updated_fields = updated_fields


class Brand(AggregateRoot):
    """Brand aggregate root."""
    
    def __init__(
        self,
        brand_id: str,
        name: str,
        industry: Industry,
        website: str,
        styling: Optional[StylingProperties] = None,
    ) -> None:
        """
        Initialize a new brand.
        
        Args:
            brand_id: Unique identifier for the brand
            name: Brand name
            industry: Brand industry
            website: Brand website
            styling: Brand styling properties
        """
        super().__init__(brand_id)
        self._name = name
        self._industry = industry
        self._website = website
        self._styling = styling
        
        # Register domain event
        self.add_domain_event(BrandCreatedEvent(brand_id, name, industry))
    
    @property
    def name(self) -> str:
        """Get the brand name."""
        return self._name
    
    @property
    def industry(self) -> Industry:
        """Get the brand industry."""
        return self._industry
    
    @property
    def website(self) -> str:
        """Get the brand website."""
        return self._website
    
    @property
    def styling(self) -> Optional[StylingProperties]:
        """Get the brand styling properties."""
        return self._styling
    
    def update_styling(self, styling: StylingProperties) -> None:
        """
        Update the brand styling properties.
        
        Args:
            styling: New styling properties
        """
        self._styling = styling
        self._mark_updated()
        self.add_domain_event(BrandUpdatedEvent(self.id, ["styling"]))
    
    def update_name(self, name: str) -> None:
        """
        Update the brand name.
        
        Args:
            name: New brand name
        """
        self._name = name
        self._mark_updated()
        self.add_domain_event(BrandUpdatedEvent(self.id, ["name"]))
    
    def update_website(self, website: str) -> None:
        """
        Update the brand website.
        
        Args:
            website: New brand website
        """
        self._website = website
        self._mark_updated()
        self.add_domain_event(BrandUpdatedEvent(self.id, ["website"]))
    
    def update_industry(self, industry: Industry) -> None:
        """
        Update the brand industry.
        
        Args:
            industry: New brand industry
        """
        self._industry = industry
        self._mark_updated()
        self.add_domain_event(BrandUpdatedEvent(self.id, ["industry"]))


class BrandRepository(Repository[Brand]):
    """Repository for brands."""
    
    def get_by_id(self, entity_id: str) -> Optional[Brand]:
        """
        Get a brand by ID.
        
        Args:
            entity_id: ID of the brand to get
            
        Returns:
            The brand if found, None otherwise
        """
        # Implementation would use a data store
        pass
    
    def save(self, entity: Brand) -> Brand:
        """
        Save a brand.
        
        Args:
            entity: Brand to save
            
        Returns:
            The saved brand
        """
        # Implementation would use a data store
        events = entity.clear_domain_events()
        DomainEventPublisher.publish(events)
        return entity
    
    def delete(self, entity: Brand) -> None:
        """
        Delete a brand.
        
        Args:
            entity: Brand to delete
        """
        # Implementation would use a data store
        pass


# Content bounded context

class ContentStatus(Enum):
    """Content status enum."""
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ContentType(Enum):
    """Content type enum."""
    BLOG_POST = "blog_post"
    SOCIAL_POST = "social_post"
    EMAIL = "email"
    AD = "ad"
    LANDING_PAGE = "landing_page"


class ContentMetadata(ValueObject):
    """Content metadata value object."""
    
    def __init__(
        self,
        tags: List[str],
        seo_title: Optional[str] = None,
        seo_description: Optional[str] = None,
        target_audience: Optional[List[str]] = None,
    ) -> None:
        """
        Initialize new content metadata.
        
        Args:
            tags: Content tags
            seo_title: SEO title
            seo_description: SEO description
            target_audience: Target audience segments
        """
        self.tags = tags
        self.seo_title = seo_title
        self.seo_description = seo_description
        self.target_audience = target_audience or []


class ContentVersion(Entity):
    """Content version entity."""
    
    def __init__(
        self,
        entity_id: str,
        content_id: str,
        version_number: int,
        content_data: Dict[str, Any],
        created_by: str,
    ) -> None:
        """
        Initialize a new content version.
        
        Args:
            entity_id: Unique identifier for the version
            content_id: ID of the content this version belongs to
            version_number: Version number
            content_data: Content data
            created_by: ID of the user who created this version
        """
        super().__init__(entity_id)
        self._content_id = content_id
        self._version_number = version_number
        self._content_data = content_data
        self._created_by = created_by
    
    @property
    def content_id(self) -> str:
        """Get the content ID."""
        return self._content_id
    
    @property
    def version_number(self) -> int:
        """Get the version number."""
        return self._version_number
    
    @property
    def content_data(self) -> Dict[str, Any]:
        """Get the content data."""
        return self._content_data
    
    @property
    def created_by(self) -> str:
        """Get the ID of the user who created this version."""
        return self._created_by


class ContentCreatedEvent(DomainEvent):
    """Event for when content is created."""
    
    def __init__(
        self,
        content_id: str,
        title: str,
        content_type: ContentType,
        brand_id: str,
    ) -> None:
        """
        Initialize a new content created event.
        
        Args:
            content_id: ID of the content that was created
            title: Title of the content
            content_type: Type of the content
            brand_id: ID of the brand the content belongs to
        """
        super().__init__(
            aggregate_id=content_id,
            aggregate_type="Content",
        )
        self.title = title
        self.content_type = content_type
        self.brand_id = brand_id


class ContentStatusChangedEvent(DomainEvent):
    """Event for when content status changes."""
    
    def __init__(
        self,
        content_id: str,
        old_status: ContentStatus,
        new_status: ContentStatus,
    ) -> None:
        """
        Initialize a new content status changed event.
        
        Args:
            content_id: ID of the content whose status changed
            old_status: Previous status
            new_status: New status
        """
        super().__init__(
            aggregate_id=content_id,
            aggregate_type="Content",
        )
        self.old_status = old_status
        self.new_status = new_status


class Content(AggregateRoot):
    """Content aggregate root."""
    
    def __init__(
        self,
        content_id: str,
        title: str,
        content_type: ContentType,
        brand_id: str,
        template_id: Optional[str] = None,
        metadata: Optional[ContentMetadata] = None,
    ) -> None:
        """
        Initialize new content.
        
        Args:
            content_id: Unique identifier for the content
            title: Content title
            content_type: Content type
            brand_id: ID of the brand this content belongs to
            template_id: ID of the template used for this content
            metadata: Content metadata
        """
        super().__init__(content_id)
        self._title = title
        self._content_type = content_type
        self._brand_id = brand_id
        self._template_id = template_id
        self._metadata = metadata or ContentMetadata(tags=[])
        self._status = ContentStatus.DRAFT
        self._current_version: Optional[ContentVersion] = None
        self._versions: List[ContentVersion] = []
        
        # Register domain event
        self.add_domain_event(ContentCreatedEvent(content_id, title, content_type, brand_id))
    
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
    def template_id(self) -> Optional[str]:
        """Get the template ID."""
        return self._template_id
    
    @property
    def metadata(self) -> ContentMetadata:
        """Get the content metadata."""
        return self._metadata
    
    @property
    def status(self) -> ContentStatus:
        """Get the content status."""
        return self._status
    
    @property
    def current_version(self) -> Optional[ContentVersion]:
        """Get the current version."""
        return self._current_version
    
    @property
    def versions(self) -> List[ContentVersion]:
        """Get all versions."""
        return self._versions.copy()
    
    def update_title(self, title: str) -> None:
        """
        Update the content title.
        
        Args:
            title: New content title
        """
        self._title = title
        self._mark_updated()
    
    def update_metadata(self, metadata: ContentMetadata) -> None:
        """
        Update the content metadata.
        
        Args:
            metadata: New content metadata
        """
        self._metadata = metadata
        self._mark_updated()
    
    def change_status(self, new_status: ContentStatus) -> None:
        """
        Change the content status.
        
        Args:
            new_status: New content status
        """
        if self._status == new_status:
            return
        
        old_status = self._status
        self._status = new_status
        self._mark_updated()
        
        # Register domain event
        self.add_domain_event(ContentStatusChangedEvent(self.id, old_status, new_status))
    
    def add_version(
        self,
        version_id: str,
        content_data: Dict[str, Any],
        created_by: str,
    ) -> ContentVersion:
        """
        Add a new version.
        
        Args:
            version_id: Unique identifier for the version
            content_data: Content data
            created_by: ID of the user who created this version
            
        Returns:
            The new version
        """
        version_number = len(self._versions) + 1
        version = ContentVersion(
            entity_id=version_id,
            content_id=self.id,
            version_number=version_number,
            content_data=content_data,
            created_by=created_by,
        )
        
        self._versions.append(version)
        self._current_version = version
        self._mark_updated()
        
        return version


class ContentRepository(Repository[Content]):
    """Repository for content."""
    
    def get_by_id(self, entity_id: str) -> Optional[Content]:
        """
        Get content by ID.
        
        Args:
            entity_id: ID of the content to get
            
        Returns:
            The content if found, None otherwise
        """
        # Implementation would use a data store
        pass
    
    def save(self, entity: Content) -> Content:
        """
        Save content.
        
        Args:
            entity: Content to save
            
        Returns:
            The saved content
        """
        # Implementation would use a data store
        events = entity.clear_domain_events()
        DomainEventPublisher.publish(events)
        return entity
    
    def delete(self, entity: Content) -> None:
        """
        Delete content.
        
        Args:
            entity: Content to delete
        """
        # Implementation would use a data store
        pass


# Campaign bounded context

class CampaignStatus(Enum):
    """Campaign status enum."""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Budget(ValueObject):
    """Campaign budget value object."""
    
    def __init__(
        self,
        amount: float,
        currency: str,
        daily_limit: Optional[float] = None,
    ) -> None:
        """
        Initialize a new budget.
        
        Args:
            amount: Total budget amount
            currency: Currency code
            daily_limit: Maximum daily spend
        """
        self.amount = amount
        self.currency = currency
        self.daily_limit = daily_limit


class TargetingCriteria(ValueObject):
    """Ad set targeting criteria value object."""
    
    def __init__(
        self,
        age_range: Optional[Dict[str, int]] = None,
        genders: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        interests: Optional[List[str]] = None,
        languages: Optional[List[str]] = None,
    ) -> None:
        """
        Initialize new targeting criteria.
        
        Args:
            age_range: Age range (min/max)
            genders: Target genders
            locations: Target locations
            interests: Target interests
            languages: Target languages
        """
        self.age_range = age_range or {"min": 18, "max": 65}
        self.genders = genders or []
        self.locations = locations or []
        self.interests = interests or []
        self.languages = languages or []


class AdSet(Entity):
    """Ad set entity."""
    
    def __init__(
        self,
        entity_id: str,
        campaign_id: str,
        name: str,
        content_ids: List[str],
        targeting: TargetingCriteria,
        budget: Budget,
    ) -> None:
        """
        Initialize a new ad set.
        
        Args:
            entity_id: Unique identifier for the ad set
            campaign_id: ID of the campaign this ad set belongs to
            name: Ad set name
            content_ids: IDs of the content used in this ad set
            targeting: Targeting criteria
            budget: Ad set budget
        """
        super().__init__(entity_id)
        self._campaign_id = campaign_id
        self._name = name
        self._content_ids = content_ids
        self._targeting = targeting
        self._budget = budget
        self._is_active = False
    
    @property
    def campaign_id(self) -> str:
        """Get the campaign ID."""
        return self._campaign_id
    
    @property
    def name(self) -> str:
        """Get the ad set name."""
        return self._name
    
    @property
    def content_ids(self) -> List[str]:
        """Get the content IDs."""
        return self._content_ids.copy()
    
    @property
    def targeting(self) -> TargetingCriteria:
        """Get the targeting criteria."""
        return self._targeting
    
    @property
    def budget(self) -> Budget:
        """Get the ad set budget."""
        return self._budget
    
    @property
    def is_active(self) -> bool:
        """Check if the ad set is active."""
        return self._is_active
    
    def update_name(self, name: str) -> None:
        """
        Update the ad set name.
        
        Args:
            name: New ad set name
        """
        self._name = name
        self._mark_updated()
    
    def update_content_ids(self, content_ids: List[str]) -> None:
        """
        Update the content IDs.
        
        Args:
            content_ids: New content IDs
        """
        self._content_ids = content_ids
        self._mark_updated()
    
    def update_targeting(self, targeting: TargetingCriteria) -> None:
        """
        Update the targeting criteria.
        
        Args:
            targeting: New targeting criteria
        """
        self._targeting = targeting
        self._mark_updated()
    
    def update_budget(self, budget: Budget) -> None:
        """
        Update the ad set budget.
        
        Args:
            budget: New ad set budget
        """
        self._budget = budget
        self._mark_updated()
    
    def activate(self) -> None:
        """Activate the ad set."""
        self._is_active = True
        self._mark_updated()
    
    def deactivate(self) -> None:
        """Deactivate the ad set."""
        self._is_active = False
        self._mark_updated()


class CampaignCreatedEvent(DomainEvent):
    """Event for when a campaign is created."""
    
    def __init__(
        self,
        campaign_id: str,
        name: str,
        brand_id: str,
    ) -> None:
        """
        Initialize a new campaign created event.
        
        Args:
            campaign_id: ID of the campaign that was created
            name: Name of the campaign
            brand_id: ID of the brand the campaign belongs to
        """
        super().__init__(
            aggregate_id=campaign_id,
            aggregate_type="Campaign",
        )
        self.name = name
        self.brand_id = brand_id


class CampaignStatusChangedEvent(DomainEvent):
    """Event for when campaign status changes."""
    
    def __init__(
        self,
        campaign_id: str,
        old_status: CampaignStatus,
        new_status: CampaignStatus,
    ) -> None:
        """
        Initialize a new campaign status changed event.
        
        Args:
            campaign_id: ID of the campaign whose status changed
            old_status: Previous status
            new_status: New status
        """
        super().__init__(
            aggregate_id=campaign_id,
            aggregate_type="Campaign",
        )
        self.old_status = old_status
        self.new_status = new_status


class Campaign(AggregateRoot):
    """Campaign aggregate root."""
    
    def __init__(
        self,
        campaign_id: str,
        name: str,
        brand_id: str,
        start_date: datetime,
        end_date: Optional[datetime] = None,
        budget: Optional[Budget] = None,
    ) -> None:
        """
        Initialize a new campaign.
        
        Args:
            campaign_id: Unique identifier for the campaign
            name: Campaign name
            brand_id: ID of the brand this campaign belongs to
            start_date: Campaign start date
            end_date: Campaign end date
            budget: Campaign budget
        """
        super().__init__(campaign_id)
        self._name = name
        self._brand_id = brand_id
        self._start_date = start_date
        self._end_date = end_date
        self._budget = budget
        self._status = CampaignStatus.DRAFT
        self._ad_sets: Dict[str, AdSet] = {}
        
        # Register domain event
        self.add_domain_event(CampaignCreatedEvent(campaign_id, name, brand_id))
    
    @property
    def name(self) -> str:
        """Get the campaign name."""
        return self._name
    
    @property
    def brand_id(self) -> str:
        """Get the brand ID."""
        return self._brand_id
    
    @property
    def start_date(self) -> datetime:
        """Get the campaign start date."""
        return self._start_date
    
    @property
    def end_date(self) -> Optional[datetime]:
        """Get the campaign end date."""
        return self._end_date
    
    @property
    def budget(self) -> Optional[Budget]:
        """Get the campaign budget."""
        return self._budget
    
    @property
    def status(self) -> CampaignStatus:
        """Get the campaign status."""
        return self._status
    
    @property
    def ad_sets(self) -> Dict[str, AdSet]:
        """Get all ad sets in this campaign."""
        return self._ad_sets.copy()
    
    def update_name(self, name: str) -> None:
        """
        Update the campaign name.
        
        Args:
            name: New campaign name
        """
        self._name = name
        self._mark_updated()
    
    def update_dates(self, start_date: datetime, end_date: Optional[datetime] = None) -> None:
        """
        Update the campaign dates.
        
        Args:
            start_date: New start date
            end_date: New end date
        """
        self._start_date = start_date
        self._end_date = end_date
        self._mark_updated()
    
    def update_budget(self, budget: Budget) -> None:
        """
        Update the campaign budget.
        
        Args:
            budget: New campaign budget
        """
        self._budget = budget
        self._mark_updated()
    
    def change_status(self, new_status: CampaignStatus) -> None:
        """
        Change the campaign status.
        
        Args:
            new_status: New campaign status
        """
        if self._status == new_status:
            return
        
        old_status = self._status
        self._status = new_status
        self._mark_updated()
        
        # Register domain event
        self.add_domain_event(CampaignStatusChangedEvent(self.id, old_status, new_status))
        
        # Update ad sets based on campaign status
        if new_status == CampaignStatus.ACTIVE:
            for ad_set in self._ad_sets.values():
                ad_set.activate()
        elif new_status in (CampaignStatus.PAUSED, CampaignStatus.COMPLETED, CampaignStatus.CANCELLED):
            for ad_set in self._ad_sets.values():
                ad_set.deactivate()
    
    def add_ad_set(self, ad_set: AdSet) -> None:
        """
        Add an ad set to the campaign.
        
        Args:
            ad_set: Ad set to add
        """
        if ad_set.campaign_id != self.id:
            raise ValueError(f"Ad set {ad_set.id} belongs to a different campaign")
        
        self._ad_sets[ad_set.id] = ad_set
        self._mark_updated()
        
        # Activate ad set if campaign is active
        if self._status == CampaignStatus.ACTIVE:
            ad_set.activate()
    
    def remove_ad_set(self, ad_set_id: str) -> None:
        """
        Remove an ad set from the campaign.
        
        Args:
            ad_set_id: ID of the ad set to remove
        """
        if ad_set_id in self._ad_sets:
            del self._ad_sets[ad_set_id]
            self._mark_updated()


class CampaignRepository(Repository[Campaign]):
    """Repository for campaigns."""
    
    def get_by_id(self, entity_id: str) -> Optional[Campaign]:
        """
        Get a campaign by ID.
        
        Args:
            entity_id: ID of the campaign to get
            
        Returns:
            The campaign if found, None otherwise
        """
        # Implementation would use a data store
        pass
    
    def save(self, entity: Campaign) -> Campaign:
        """
        Save a campaign.
        
        Args:
            entity: Campaign to save
            
        Returns:
            The saved campaign
        """
        # Implementation would use a data store
        events = entity.clear_domain_events()
        DomainEventPublisher.publish(events)
        return entity
    
    def delete(self, entity: Campaign) -> None:
        """
        Delete a campaign.
        
        Args:
            entity: Campaign to delete
        """
        # Implementation would use a data store
        pass