"""
This is a compatibility script that imports the real health_api.py from the monitoring directory.
This ensures backward compatibility with existing deployment scripts.
"""

# Import everything from the actual health_api module
from monitoring.health_api import *

# If this script is run directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)