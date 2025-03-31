"""
Settings initialization

This module determines which settings to use based on the environment.
"""

import os
from src.core.settings.base import BaseSettings
from src.core.settings.development import DevelopmentSettings
from src.core.settings.staging import StagingSettings
from src.core.settings.production import ProductionSettings

# Determine which settings to use based on environment
environment = os.environ.get("UMT_ENV", "development").lower()

if environment == "production":
    settings = ProductionSettings()
elif environment == "staging":
    settings = StagingSettings()
else:
    settings = DevelopmentSettings()

# Export settings variables
__all__ = ["settings"]
