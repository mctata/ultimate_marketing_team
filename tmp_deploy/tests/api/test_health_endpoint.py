"""
Integration test for the health endpoint.
"""

import requests
import time
import statistics

# API endpoint URL
API_URL = "http://localhost:8000"

def test_root_endpoint():
    """Test the root endpoint returns correct information."""
    response = requests.get(API_URL + "/")
    assert response.status_code == 200
    data = response.json()
    
    # Check required fields
    assert "name" in data
    assert "version" in data
    assert "status" in data
    
    # Check values
    assert data["status"] == "online"
    assert isinstance(data["version"], str)
    
def test_health_endpoint():
    """Test the health endpoint returns correct information."""
    response = requests.get(API_URL + "/api/health")
    assert response.status_code == 200
    data = response.json()
    
    # Check required fields
    assert "status" in data
    assert "timestamp" in data
    assert "version" in data
    assert "environment" in data
    
    # Check values
    assert data["status"] == "healthy"
    assert isinstance(data["timestamp"], float)
    assert isinstance(data["version"], str)
    assert isinstance(data["environment"], str)
    
def test_api_v1_health_endpoint():
    """Test the API v1 health endpoint returns correct information."""
    response = requests.get(API_URL + "/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    
    # Check required fields
    assert "status" in data
    assert "timestamp" in data
    assert "version" in data
    assert "environment" in data
    
    # Check values
    assert data["status"] == "healthy"
    assert isinstance(data["timestamp"], float)
    assert isinstance(data["version"], str)
    assert isinstance(data["environment"], str)
    
def test_health_endpoint_performance():
    """Test health endpoint performance."""
    # Perform 10 requests to measure response time
    response_times = []
    
    for _ in range(10):
        start_time = time.time()
        response = requests.get(API_URL + "/api/health")
        end_time = time.time()
        assert response.status_code == 200
        
        # Calculate response time in milliseconds
        response_time = (end_time - start_time) * 1000
        response_times.append(response_time)
    
    # Calculate statistics
    avg_response_time = statistics.mean(response_times)
    max_response_time = max(response_times)
    min_response_time = min(response_times)
    
    # Log performance metrics
    print("Health endpoint performance:")
    print("  Average response time: %.2f ms" % avg_response_time)
    print("  Minimum response time: %.2f ms" % min_response_time)
    print("  Maximum response time: %.2f ms" % max_response_time)
    
    # Assert reasonable performance - adjust thresholds as needed
    assert avg_response_time < 100, "Average response time exceeds 100ms"
    assert max_response_time < 200, "Maximum response time exceeds 200ms"

if __name__ == "__main__":
    # Run tests directly if script is executed
    print("Testing root endpoint...")
    test_root_endpoint()
    print("Testing health endpoint...")
    test_health_endpoint()
    print("Testing API v1 health endpoint...")
    test_api_v1_health_endpoint()
    print("Testing health endpoint performance...")
    test_health_endpoint_performance()
    print("All tests passed!")