#!/usr/bin/env python3
import requests
import json
import sys
import argparse
from urllib.parse import urljoin

def test_endpoint(base_url, path, description, bearer_token=None, verbose=False):
    """Test an API endpoint and return the result"""
    full_url = urljoin(base_url, path)
    print(f"Testing {description} at {full_url}...")
    
    headers = {}
    if bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"
    
    try:
        response = requests.get(full_url, headers=headers, timeout=5)
        status_code = response.status_code
        
        try:
            data = response.json()
            data_preview = json.dumps(data, indent=2)[:200] + "..." if len(json.dumps(data, indent=2)) > 200 else json.dumps(data, indent=2)
        except:
            data = None
            data_preview = response.text[:200] + "..." if len(response.text) > 200 else response.text
        
        if status_code == 200:
            print(f"✅ Success: Status code {status_code}")
            if verbose and data:
                print(f"Response data: {data_preview}")
            return True, data
        else:
            print(f"❌ Error: Status code {status_code}")
            if verbose:
                print(f"Response: {data_preview}")
            return False, data
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False, None

def main():
    parser = argparse.ArgumentParser(description="Test the template API endpoints")
    parser.add_argument("--host", default="http://localhost:8000", help="API host URL")
    parser.add_argument("--token", help="Bearer token for authenticated endpoints")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show verbose output")
    parser.add_argument("--endpoint", "-e", help="Test a specific endpoint path")
    parser.add_argument("--only-test", action="store_true", help="Only test endpoints with /test in the path")
    parser.add_argument("--debug", action="store_true", help="Only test debug endpoints")
    args = parser.parse_args()
    
    base_url = args.host
    bearer_token = args.token
    verbose = args.verbose
    
    # Check if API is available at all
    test_endpoint(base_url, "/", "Root Endpoint", verbose=verbose)
    
    if args.endpoint:
        # Test a specific endpoint
        success, data = test_endpoint(base_url, args.endpoint, f"Custom Endpoint {args.endpoint}", 
                                      bearer_token=bearer_token, verbose=verbose)
        sys.exit(0 if success else 1)
    
    # First check the debug routes to see what's available
    print("\nChecking available routes...")
    try:
        debug_url = "/api/debug/routes"
        response = requests.get(urljoin(base_url, debug_url))
        if response.status_code == 200:
            routes = response.json()
            print(f"Found {routes['count']} registered routes:")
            for route in routes['routes']:
                path = route['path']
                methods = ', '.join(route['methods'])
                print(f"  {methods} {path}")
            
            # Use the actual routes from the server if debug endpoint is available
            test_routes = []
            for route in routes['routes']:
                path = route['path']
                if 'GET' in route['methods']:
                    if args.only_test and '/test' not in path:
                        continue
                    if args.debug and not path.startswith('/api/debug'):
                        continue
                    test_routes.append((path, f"{route['methods']} {path}"))
                    
            if not test_routes:
                print("No routes match the criteria for testing.")
                return
        else:
            print(f"❌ Error accessing debug routes: {response.status_code}")
            # Fall back to predefined list of routes
            test_routes = get_predefined_routes(args.only_test, args.debug)
    except Exception as e:
        print(f"❌ Exception checking routes: {str(e)}")
        # Fall back to predefined list of routes
        test_routes = get_predefined_routes(args.only_test, args.debug)
    
    # Check router status if available
    print("\nChecking router status...")
    test_endpoint(base_url, "/api/debug/router-status", "Router Status", verbose=True)
    
    # Test endpoints
    print("\nTesting API endpoints...")
    success_count = 0
    for path, description in test_routes:
        need_token = '/test' not in path and not path.startswith('/api/debug') and path != '/' and path != '/api/health'
        token = bearer_token if need_token else None
        if test_endpoint(base_url, path, description, bearer_token=token, verbose=verbose)[0]:
            success_count += 1
        print("-" * 50)
    
    print(f"\nSummary: {success_count}/{len(test_routes)} tests passed.")
    
    # Try to access templates-test-page
    print("\nChecking test page availability:")
    test_endpoint(base_url, "/api/templates-test", "Templates Test Page", verbose=verbose)

def get_predefined_routes(only_test=False, debug_only=False):
    """Return a predefined list of routes to test based on filters"""
    all_routes = [
        ("/", "Root Endpoint"),
        ("/api/health", "Health Endpoint"),
        ("/api/debug/routes", "Debug Routes Endpoint"),
        ("/api/debug/router-status", "Router Status Endpoint"),
        ("/api/v1/templates/test", "Templates Test Endpoint"),
        ("/api/v1/seed-templates/test", "Seed Templates Test Endpoint"),
        ("/api/v1/templates/categories-test", "Categories Test Endpoint"),
        ("/api/v1/test-templates", "Direct Templates Test Endpoint"),
        ("/api/templates-test", "Templates Test Page"),
        ("/api/v1/templates/categories", "Template Categories"),
        ("/api/v1/templates/industries", "Template Industries"),
        ("/api/v1/templates/formats", "Template Formats"),
        ("/api/v1/templates", "Templates"),
        ("/api/v1/templates/popular", "Popular Templates"),
        ("/api/v1/templates/recommended", "Recommended Templates"),
        ("/api/v1/seed-templates/check", "Templates Exist Check")
    ]
    
    if only_test:
        return [(path, desc) for path, desc in all_routes if '/test' in path.lower()]
    if debug_only:
        return [(path, desc) for path, desc in all_routes if path.startswith('/api/debug')]
    return all_routes

if __name__ == "__main__":
    main()