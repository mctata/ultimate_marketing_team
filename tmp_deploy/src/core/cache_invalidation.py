"""
Cache invalidation module for automated and manual cache invalidation.

This module provides utilities to automatically invalidate cache entries 
when database models are modified or deleted, helping maintain cache consistency.
"""

import functools
import inspect
import logging
from typing import Any, Callable, Dict, List, Optional, Set, Type, TypeVar, Union, cast

from sqlalchemy import event
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history
from sqlalchemy.orm.base import instance_state

from src.core.database import Base
from src.core.cache import cache, CacheCategory, invalidate_category

# Type variables
ModelType = TypeVar('ModelType', bound=Base)
F = TypeVar('F', bound=Callable[..., Any])

# Track registered models and their invalidation rules
_registered_models: Dict[str, Set[str]] = {}


def register_model_invalidation(
    model_class: Type[Base],
    category: CacheCategory,
    fields_to_watch: Optional[List[str]] = None
) -> None:
    """
    Register a model class for automatic cache invalidation.
    
    Args:
        model_class: SQLAlchemy model class to watch
        category: Cache category to invalidate on changes
        fields_to_watch: Optional list of fields to trigger invalidation 
                         (if None, any field change triggers invalidation)
    """
    model_name = model_class.__name__
    if model_name not in _registered_models:
        _registered_models[model_name] = set()
    
    # Set up SQLAlchemy event listeners
    event.listen(model_class, 'after_update', _make_update_listener(category, fields_to_watch))
    event.listen(model_class, 'after_delete', _make_delete_listener(category))
    
    # Record this registration
    _registered_models[model_name].add(str(category))
    
    logging.info(f"Registered cache invalidation for model {model_name} with category {category}")


def _make_update_listener(
    category: CacheCategory,
    fields_to_watch: Optional[List[str]] = None
) -> Callable:
    """Create a listener function for model updates."""
    
    def listener(mapper, connection, target):
        # Check if any watched fields have changed
        if fields_to_watch:
            state = instance_state(target)
            
            # Get the list of changed attributes
            changed_fields = [
                attr.key for attr in state.attrs
                if attr.key in fields_to_watch and get_history(target, attr.key).has_changes()
            ]
            
            # Only invalidate if watched fields changed
            if not changed_fields:
                return
        
        # Invalidate the category
        count = invalidate_category(category)
        logging.info(
            f"Cache invalidation: updated {target.__class__.__name__} (id={getattr(target, 'id', None)}) "
            f"invalidated {count} entries in category {category}"
        )
    
    return listener


def _make_delete_listener(category: CacheCategory) -> Callable:
    """Create a listener function for model deletions."""
    
    def listener(mapper, connection, target):
        # Invalidate the category
        count = invalidate_category(category)
        logging.info(
            f"Cache invalidation: deleted {target.__class__.__name__} (id={getattr(target, 'id', None)}) "
            f"invalidated {count} entries in category {category}"
        )
    
    return listener


def invalidate_on_commit(categories: List[CacheCategory]) -> Callable[[F], F]:
    """
    Decorator to invalidate cache categories when a database transaction commits.
    
    Args:
        categories: List of cache categories to invalidate
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Find the db session parameter
            session = None
            
            # Look for session parameter in kwargs or args
            if 'db' in kwargs:
                session = kwargs['db']
            elif 'session' in kwargs:
                session = kwargs['session']
            else:
                # Try to find session in the function signature
                sig = inspect.signature(func)
                param_names = list(sig.parameters.keys())
                
                for i, param_name in enumerate(param_names):
                    if param_name in ('db', 'session'):
                        if i < len(args):
                            session = args[i]
                            break
            
            if session is None:
                # No session found, just call the function
                return func(*args, **kwargs)
                
            # Check if this is a SQLAlchemy session
            if not isinstance(session, Session):
                # Not a SQLAlchemy session, just call the function
                return func(*args, **kwargs)
                
            try:
                # Execute the function
                result = func(*args, **kwargs)
                
                # Attach callback to commit to invalidate caches
                def on_commit(session):
                    for category in categories:
                        count = invalidate_category(category)
                        logging.info(f"Cache invalidation: commit invalidated {count} entries in category {category}")
                
                event.listen(session, 'after_commit', on_commit, once=True)
                
                return result
            except Exception:
                # If an exception occurs, don't invalidate cache
                raise
                
        return cast(F, wrapper)
    
    return decorator


def register_common_models():
    """Register common models for automatic cache invalidation."""
    from src.models.brand import Brand
    from src.models.project import Project
    from src.models.content import ContentDraft, ContentVersion
    from src.models.campaign import Campaign, CampaignVersion
    from src.models.user import User
    from src.models.system import SystemSetting
    
    # Register the models with appropriate cache categories
    register_model_invalidation(Brand, CacheCategory.BRAND)
    register_model_invalidation(Project, CacheCategory.PROJECT)
    register_model_invalidation(ContentDraft, CacheCategory.CONTENT)
    register_model_invalidation(ContentVersion, CacheCategory.CONTENT)
    register_model_invalidation(Campaign, CacheCategory.CAMPAIGN)
    register_model_invalidation(CampaignVersion, CacheCategory.CAMPAIGN)
    register_model_invalidation(User, CacheCategory.USER)
    register_model_invalidation(SystemSetting, CacheCategory.SYSTEM)