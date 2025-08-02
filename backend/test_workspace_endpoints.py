#!/usr/bin/env python3
"""
Test script for Workspace API endpoints
This script demonstrates how to use the workspace endpoints with Firebase authentication.

Note: This is for testing purposes only. In production, the frontend will handle
Firebase authentication and send the ID token to these endpoints.
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

def test_workspace_info():
    """Test the workspace info endpoint (no auth required)"""
    print("🔍 Testing workspace info endpoint...")
    
    response = requests.get(f"{BASE_URL}/workspaces-info")
    
    if response.status_code == 200:
        print("✅ Workspace info endpoint working!")
        data = response.json()
        print(f"📋 Service: {data['message']}")
        print(f"🏗️  Structure: {data['collection_structure']}")
        print(f"🔐 Auth: {data['authentication']}")
        print(f"📊 Endpoints: {len(data['endpoints'])} available")
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)

def test_workspace_endpoints_without_auth():
    """Test workspace endpoints without authentication (should fail)"""
    print("\n🔒 Testing workspace endpoints without authentication...")
    
    endpoints_to_test = [
        ("GET", f"{BASE_URL}/workspaces", "List workspaces"),
        ("POST", f"{BASE_URL}/workspaces", "Create workspace"),
        ("GET", f"{BASE_URL}/workspaces/test-id", "Get workspace"),
        ("PUT", f"{BASE_URL}/workspaces/test-id", "Update workspace"),
        ("DELETE", f"{BASE_URL}/workspaces/test-id", "Delete workspace"),
    ]
    
    for method, url, description in endpoints_to_test:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json={"name": "Test Workspace"})
        elif method == "PUT":
            response = requests.put(url, json={"name": "Updated Workspace"})
        elif method == "DELETE":
            response = requests.delete(url)
        
        if response.status_code == 401:
            print(f"✅ {description}: Properly protected (401 Unauthorized)")
        else:
            print(f"❌ {description}: Unexpected status {response.status_code}")

def test_api_health():
    """Test API health and Firebase initialization"""
    print("\n💊 Testing API health...")
    
    response = requests.get("http://localhost:8000/")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ API Status: {data['status']}")
        print(f"🔥 Firebase Initialized: {data['firebase_initialized']}")
        print(f"📦 Version: {data['version']}")
    else:
        print(f"❌ API Health Check Failed: {response.status_code}")

def main():
    """Run all tests"""
    print("🚀 Testing Podion AI Workspace API Endpoints")
    print("=" * 50)
    
    try:
        test_api_health()
        test_workspace_info()
        test_workspace_endpoints_without_auth()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
        print("\n📝 Next Steps:")
        print("1. Frontend integration: Replace mock data with API calls")
        print("2. Authentication: Frontend will send Firebase ID tokens")
        print("3. Testing: Use real Firebase auth tokens for full testing")
        print("4. Workspace-Podcast linking: Add workspace_id to podcast operations")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on localhost:8000")
        print("Run: cd backend && source venv/bin/activate && python -m uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
