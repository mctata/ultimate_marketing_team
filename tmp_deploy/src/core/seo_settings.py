"""
Configuration settings for SEO-related functionality, including Google Search Console API
"""
from typing import Dict, Any, Optional
import os
import json
from pathlib import Path

# Google Search Console OAuth2 settings
GOOGLE_OAUTH2_CLIENT_ID = os.getenv("GOOGLE_OAUTH2_CLIENT_ID", "")
GOOGLE_OAUTH2_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH2_CLIENT_SECRET", "")
GOOGLE_OAUTH2_REDIRECT_URI = os.getenv("GOOGLE_OAUTH2_REDIRECT_URI", "http://localhost:8000/api/seo/oauth2callback")

# Token storage directory
TOKEN_DIR = Path(os.getenv("TOKEN_STORAGE_DIR", ".tokens"))
if not TOKEN_DIR.exists():
    TOKEN_DIR.mkdir(parents=True, exist_ok=True)

# API settings
SEARCH_CONSOLE_API_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
SEARCH_CONSOLE_API_BASE_URL = "https://www.googleapis.com/webmasters/v3/"

# Cache settings
SEO_CACHE_TTL = int(os.getenv("SEO_CACHE_TTL", "3600"))  # Default to 1 hour

# API rate limiting
MAX_QUERIES_PER_DAY = int(os.getenv("GSC_MAX_QUERIES_PER_DAY", "2000"))  # Default GSC limit

# Content update recommendations
MIN_CONTENT_AGE_FOR_UPDATE = int(os.getenv("MIN_CONTENT_AGE_FOR_UPDATE", "30"))  # 30 days


def get_token_path(brand_id: int) -> Path:
    """Get the path to the token file for a specific brand"""
    return TOKEN_DIR / f"gsc_token_{brand_id}.json"


def save_token(brand_id: int, token_data: Dict[str, Any]) -> None:
    """Save OAuth2 token data to file"""
    token_path = get_token_path(brand_id)
    with open(token_path, "w") as f:
        json.dump(token_data, f)


def load_token(brand_id: int) -> Optional[Dict[str, Any]]:
    """Load OAuth2 token data from file"""
    token_path = get_token_path(brand_id)
    if not token_path.exists():
        return None
    
    with open(token_path, "r") as f:
        return json.load(f)