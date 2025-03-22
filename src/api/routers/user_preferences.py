from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from src.core.security import get_current_user
from src.core.database import get_db
from src.models.system import User, UserPreference

# Models for API
class UserPreferenceRequest(BaseModel):
    theme: Optional[str] = Field(None, description="User interface theme (light, dark, auto)")
    notifications_enabled: Optional[bool] = Field(None, description="Whether to enable notifications")
    email_frequency: Optional[str] = Field(None, description="Email notification frequency (daily, weekly, never)")
    default_dashboard_view: Optional[str] = Field(None, description="Default dashboard view")
    timezone: Optional[str] = Field(None, description="User timezone")
    language: Optional[str] = Field(None, description="User interface language")
    settings: Optional[Dict[str, Any]] = Field(None, description="Additional settings as JSON")

class AccessibilitySettings(BaseModel):
    high_contrast: Optional[bool] = Field(None, description="Enable high contrast mode")
    font_size: Optional[str] = Field(None, description="Font size (normal, large, extra-large)")
    reduced_motion: Optional[bool] = Field(None, description="Reduce motion effects")
    screen_reader_optimized: Optional[bool] = Field(None, description="Optimize for screen readers")
    keyboard_shortcuts_enabled: Optional[bool] = Field(None, description="Enable keyboard shortcuts")
    color_blind_mode: Optional[str] = Field(None, description="Color blind mode (off, protanopia, deuteranopia, tritanopia)")

class EditorSettings(BaseModel):
    auto_save: Optional[bool] = Field(None, description="Enable auto-save in editors")
    auto_save_interval: Optional[int] = Field(None, description="Auto-save interval in seconds")
    spell_check: Optional[bool] = Field(None, description="Enable spell checking")
    grammar_check: Optional[bool] = Field(None, description="Enable grammar checking")
    suggestion_mode: Optional[str] = Field(None, description="AI suggestion mode (off, light, normal, aggressive)")
    default_format: Optional[str] = Field(None, description="Default content format")

class CollaborationSettings(BaseModel):
    show_presence: Optional[bool] = Field(None, description="Show user presence indicators")
    real_time_updates: Optional[bool] = Field(None, description="Enable real-time updates")
    enable_comments: Optional[bool] = Field(None, description="Enable comments")
    notify_on_mentions: Optional[bool] = Field(None, description="Notify when mentioned in comments")
    display_cursor_names: Optional[bool] = Field(None, description="Display user names with cursors")

class FeatureSettings(BaseModel):
    ai_suggestions: Optional[bool] = Field(None, description="Enable AI writing suggestions")
    seo_tips: Optional[bool] = Field(None, description="Enable SEO optimization tips")
    content_analytics: Optional[bool] = Field(None, description="Show content analytics")
    display_character_count: Optional[bool] = Field(None, description="Display character count in editors")

# Router definition
router = APIRouter(
    prefix="/user-preferences",
    tags=["user-preferences"],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def get_user_preferences(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user preferences for the current user."""
    # Get or create user preferences
    preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreference(
            user_id=user.id,
            theme="light",
            notifications_enabled=True,
            email_frequency="daily",
            timezone="UTC",
            language="en",
            settings={}
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
        
    # Return preferences
    return {
        "theme": preferences.theme,
        "notifications_enabled": preferences.notifications_enabled,
        "email_frequency": preferences.email_frequency,
        "default_dashboard_view": preferences.default_dashboard_view,
        "timezone": preferences.timezone,
        "language": preferences.language,
        "settings": preferences.settings or {},
        "created_at": preferences.created_at,
        "updated_at": preferences.updated_at
    }

@router.put("/")
async def update_user_preferences(
    preferences_data: UserPreferenceRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user preferences for the current user."""
    # Get or create user preferences
    preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreference(
            user_id=user.id,
            theme="light",
            notifications_enabled=True,
            email_frequency="daily",
            timezone="UTC",
            language="en",
            settings={}
        )
        db.add(preferences)
    
    # Update preferences
    if preferences_data.theme is not None:
        preferences.theme = preferences_data.theme
    if preferences_data.notifications_enabled is not None:
        preferences.notifications_enabled = preferences_data.notifications_enabled
    if preferences_data.email_frequency is not None:
        preferences.email_frequency = preferences_data.email_frequency
    if preferences_data.default_dashboard_view is not None:
        preferences.default_dashboard_view = preferences_data.default_dashboard_view
    if preferences_data.timezone is not None:
        preferences.timezone = preferences_data.timezone
    if preferences_data.language is not None:
        preferences.language = preferences_data.language
    if preferences_data.settings is not None:
        preferences.settings = preferences_data.settings
    
    # Update timestamp
    preferences.updated_at = datetime.now()
    
    # Commit changes
    db.commit()
    db.refresh(preferences)
    
    # Return updated preferences
    return {
        "theme": preferences.theme,
        "notifications_enabled": preferences.notifications_enabled,
        "email_frequency": preferences.email_frequency,
        "default_dashboard_view": preferences.default_dashboard_view,
        "timezone": preferences.timezone,
        "language": preferences.language,
        "settings": preferences.settings or {},
        "created_at": preferences.created_at,
        "updated_at": preferences.updated_at
    }

@router.put("/accessibility")
async def update_accessibility_settings(
    settings: AccessibilitySettings,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update accessibility settings for the current user."""
    # Get or create user preferences
    preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreference(
            user_id=user.id,
            theme="light",
            notifications_enabled=True,
            email_frequency="daily",
            timezone="UTC",
            language="en",
            settings={}
        )
        db.add(preferences)
        
    # Initialize accessibility settings if they don't exist
    if preferences.settings is None:
        preferences.settings = {}
    if "accessibility" not in preferences.settings:
        preferences.settings["accessibility"] = {}
        
    # Update accessibility settings
    accessibility = preferences.settings["accessibility"]
    if settings.high_contrast is not None:
        accessibility["high_contrast"] = settings.high_contrast
    if settings.font_size is not None:
        accessibility["font_size"] = settings.font_size
    if settings.reduced_motion is not None:
        accessibility["reduced_motion"] = settings.reduced_motion
    if settings.screen_reader_optimized is not None:
        accessibility["screen_reader_optimized"] = settings.screen_reader_optimized
    if settings.keyboard_shortcuts_enabled is not None:
        accessibility["keyboard_shortcuts_enabled"] = settings.keyboard_shortcuts_enabled
    if settings.color_blind_mode is not None:
        accessibility["color_blind_mode"] = settings.color_blind_mode
        
    # Update preferences and timestamp
    preferences.settings["accessibility"] = accessibility
    preferences.updated_at = datetime.now()
    
    # Commit changes
    db.commit()
    db.refresh(preferences)
    
    # Return updated accessibility settings
    return preferences.settings.get("accessibility", {})

@router.put("/editor")
async def update_editor_settings(
    settings: EditorSettings,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update editor settings for the current user."""
    # Get or create user preferences
    preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreference(
            user_id=user.id,
            theme="light",
            notifications_enabled=True,
            email_frequency="daily",
            timezone="UTC",
            language="en",
            settings={}
        )
        db.add(preferences)
        
    # Initialize editor settings if they don't exist
    if preferences.settings is None:
        preferences.settings = {}
    if "editor" not in preferences.settings:
        preferences.settings["editor"] = {}
        
    # Update editor settings
    editor = preferences.settings["editor"]
    if settings.auto_save is not None:
        editor["auto_save"] = settings.auto_save
    if settings.auto_save_interval is not None:
        editor["auto_save_interval"] = settings.auto_save_interval
    if settings.spell_check is not None:
        editor["spell_check"] = settings.spell_check
    if settings.grammar_check is not None:
        editor["grammar_check"] = settings.grammar_check
    if settings.suggestion_mode is not None:
        editor["suggestion_mode"] = settings.suggestion_mode
    if settings.default_format is not None:
        editor["default_format"] = settings.default_format
        
    # Update preferences and timestamp
    preferences.settings["editor"] = editor
    preferences.updated_at = datetime.now()
    
    # Commit changes
    db.commit()
    db.refresh(preferences)
    
    # Return updated editor settings
    return preferences.settings.get("editor", {})

@router.put("/collaboration")
async def update_collaboration_settings(
    settings: CollaborationSettings,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update collaboration settings for the current user."""
    # Get or create user preferences
    preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreference(
            user_id=user.id,
            theme="light",
            notifications_enabled=True,
            email_frequency="daily",
            timezone="UTC",
            language="en",
            settings={}
        )
        db.add(preferences)
        
    # Initialize collaboration settings if they don't exist
    if preferences.settings is None:
        preferences.settings = {}
    if "collaboration" not in preferences.settings:
        preferences.settings["collaboration"] = {}
        
    # Update collaboration settings
    collaboration = preferences.settings["collaboration"]
    if settings.show_presence is not None:
        collaboration["show_presence"] = settings.show_presence
    if settings.real_time_updates is not None:
        collaboration["real_time_updates"] = settings.real_time_updates
    if settings.enable_comments is not None:
        collaboration["enable_comments"] = settings.enable_comments
    if settings.notify_on_mentions is not None:
        collaboration["notify_on_mentions"] = settings.notify_on_mentions
    if settings.display_cursor_names is not None:
        collaboration["display_cursor_names"] = settings.display_cursor_names
        
    # Update preferences and timestamp
    preferences.settings["collaboration"] = collaboration
    preferences.updated_at = datetime.now()
    
    # Commit changes
    db.commit()
    db.refresh(preferences)
    
    # Return updated collaboration settings
    return preferences.settings.get("collaboration", {})

@router.put("/features")
async def update_feature_settings(
    settings: FeatureSettings,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update feature settings for the current user."""
    # Get or create user preferences
    preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreference(
            user_id=user.id,
            theme="light",
            notifications_enabled=True,
            email_frequency="daily",
            timezone="UTC",
            language="en",
            settings={}
        )
        db.add(preferences)
        
    # Initialize feature settings if they don't exist
    if preferences.settings is None:
        preferences.settings = {}
    if "features" not in preferences.settings:
        preferences.settings["features"] = {}
        
    # Update feature settings
    features = preferences.settings["features"]
    if settings.ai_suggestions is not None:
        features["ai_suggestions"] = settings.ai_suggestions
    if settings.seo_tips is not None:
        features["seo_tips"] = settings.seo_tips
    if settings.content_analytics is not None:
        features["content_analytics"] = settings.content_analytics
    if settings.display_character_count is not None:
        features["display_character_count"] = settings.display_character_count
        
    # Update preferences and timestamp
    preferences.settings["features"] = features
    preferences.updated_at = datetime.now()
    
    # Commit changes
    db.commit()
    db.refresh(preferences)
    
    # Return updated feature settings
    return preferences.settings.get("features", {})

@router.get("/keyboards-shortcuts")
async def get_keyboard_shortcuts(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get keyboard shortcuts for the application."""
    # Define default keyboard shortcuts
    default_shortcuts = {
        "global": {
            "save": "Ctrl+S",
            "undo": "Ctrl+Z",
            "redo": "Ctrl+Shift+Z",
            "find": "Ctrl+F",
            "help": "F1"
        },
        "editor": {
            "bold": "Ctrl+B",
            "italic": "Ctrl+I",
            "underline": "Ctrl+U",
            "heading1": "Ctrl+1",
            "heading2": "Ctrl+2",
            "heading3": "Ctrl+3",
            "orderedList": "Ctrl+Shift+7",
            "unorderedList": "Ctrl+Shift+8",
            "quote": "Ctrl+Shift+9",
            "link": "Ctrl+K",
            "code": "Ctrl+E"
        },
        "collaboration": {
            "comment": "Ctrl+Shift+M",
            "resolve": "Ctrl+Shift+Enter",
            "nextComment": "F8",
            "previousComment": "Shift+F8"
        },
        "navigation": {
            "dashboard": "Alt+1",
            "content": "Alt+2",
            "campaigns": "Alt+3",
            "analytics": "Alt+4",
            "settings": "Alt+5"
        }
    }
    
    # Get user preferences
    preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if preferences and preferences.settings and "keyboard_shortcuts" in preferences.settings:
        # Merge default with user customizations
        custom_shortcuts = preferences.settings.get("keyboard_shortcuts", {})
        
        # Deep merge
        for category, shortcuts in custom_shortcuts.items():
            if category in default_shortcuts:
                default_shortcuts[category].update(shortcuts)
            else:
                default_shortcuts[category] = shortcuts
    
    return default_shortcuts

@router.put("/keyboard-shortcuts")
async def update_keyboard_shortcuts(
    shortcuts: Dict[str, Dict[str, str]],
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update keyboard shortcuts for the current user."""
    # Get or create user preferences
    preferences = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreference(
            user_id=user.id,
            theme="light",
            notifications_enabled=True,
            email_frequency="daily",
            timezone="UTC",
            language="en",
            settings={}
        )
        db.add(preferences)
    
    # Initialize settings if needed
    if preferences.settings is None:
        preferences.settings = {}
    
    # Update keyboard shortcuts
    preferences.settings["keyboard_shortcuts"] = shortcuts
    preferences.updated_at = datetime.now()
    
    # Commit changes
    db.commit()
    db.refresh(preferences)
    
    # Return updated keyboard shortcuts
    return preferences.settings.get("keyboard_shortcuts", {})