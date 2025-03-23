import requests
import json

def test_endpoint(url, description):
    print(f"Testing {description} at {url}...")
    try:
        # Check if this is a test endpoint (which doesn't need auth)
        if "/test" in url:
            # No auth needed for test endpoints
            response = requests.get(url)
        else:
            # Add a mock JWT token to pass authentication (this is for testing purposes only)
            headers = {
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
            }
            response = requests.get(url, headers=headers)
            
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Status code {response.status_code}")
            print(f"Response data: {json.dumps(data, indent=2)[:200]}...")
            return True
        else:
            print(f"❌ Error: Status code {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            return False
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

def main():
    base_url = "http://localhost:8000"
    
    # First check the debug routes to see what's available
    print("Checking available routes...")
    try:
        response = requests.get(f"{base_url}/api/debug/routes")
        if response.status_code == 200:
            routes = response.json()
            print(f"Found {routes['count']} registered routes:")
            for route in routes['routes']:
                print(f"  {', '.join(route['methods'])} {route['path']}")
        else:
            print(f"❌ Error accessing debug routes: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception checking routes: {str(e)}")
    
    # Test endpoints
    tests = [
        (f"{base_url}/", "Root Endpoint"),
        (f"{base_url}/api/health", "Health Endpoint"),
        (f"{base_url}/api/v1/templates/categories-test", "Categories Test Endpoint"),
        (f"{base_url}/api/v1/templates/categories", "Template Categories"),
        (f"{base_url}/api/v1/templates/industries", "Template Industries"),
        (f"{base_url}/api/v1/templates/formats", "Template Formats"),
        (f"{base_url}/api/v1/templates", "Templates"),
        (f"{base_url}/api/v1/templates/popular", "Popular Templates"),
        (f"{base_url}/api/v1/templates/recommended", "Recommended Templates"),
        (f"{base_url}/api/v1/seed-templates/check", "Templates Check")
    ]
    
    success_count = 0
    for url, description in tests:
        if test_endpoint(url, description):
            success_count += 1
        print("-" * 50)
    
    print(f"\nSummary: {success_count}/{len(tests)} tests passed.")

if __name__ == "__main__":
    main()