#!/usr/bin/env python3
"""
Simple test script for Paddle integration
Tests the Paddle API endpoints without requiring full authentication
"""

import os
import asyncio
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_paddle_api():
    """Test basic Paddle API connectivity"""
    
    api_key = os.getenv('PADDLE_API_KEY')
    environment = os.getenv('PADDLE_ENVIRONMENT', 'sandbox')
    
    if not api_key:
        print("❌ PADDLE_API_KEY not found in environment variables")
        print("Please add your Paddle API key to the .env file:")
        print("PADDLE_API_KEY=your-paddle-api-key-here")
        return False
    
    # Determine API base URL
    if environment == 'production':
        api_base_url = "https://api.paddle.com"
    else:
        api_base_url = "https://sandbox-api.paddle.com"
    
    print(f"🔧 Testing Paddle API in {environment} mode")
    print(f"🌐 API Base URL: {api_base_url}")
    print(f"🔑 API Key: {api_key[:12]}...")
    print()
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Check API connectivity with a simple request
    print("📡 Test 1: API Connectivity")
    try:
        async with httpx.AsyncClient() as client:
            # Try to list products (this should work with any valid API key)
            response = await client.get(
                f"{api_base_url}/products",
                headers=headers,
                timeout=10.0
            )
            
            if response.status_code == 200:
                print("✅ API connectivity successful!")
                data = response.json()
                print(f"   Response: {len(data.get('data', []))} products found")
            elif response.status_code == 401:
                print("❌ Authentication failed - check your API key")
                return False
            else:
                print(f"⚠️  Unexpected response: {response.status_code}")
                print(f"   Response: {response.text}")
                
    except Exception as e:
        print(f"❌ API connectivity failed: {str(e)}")
        return False
    
    print()
    
    # Test 2: Test transaction creation (this will fail without valid price IDs, but we can see the error)
    print("🛒 Test 2: Transaction Creation")
    try:
        transaction_data = {
            "items": [
                {
                    "price_id": "pri_01k361dv20d9j4prp20kddnra1",  # Your Starter plan
                    "quantity": 1
                }
            ],
            "customer_email": "test@example.com",
            "custom_data": {
                "user_id": "test-user-123",
                "plan_id": "starter"
            },
            "checkout": {
                "url": "https://example.com/success"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_base_url}/transactions",
                json=transaction_data,
                headers=headers,
                timeout=10.0
            )
            
            if response.status_code == 201:
                print("✅ Transaction created successfully!")
                data = response.json()
                transaction_id = data.get("data", {}).get("id")
                checkout_url = f"https://checkout.paddle.com/transaction/{transaction_id}"
                print(f"   Transaction ID: {transaction_id}")
                print(f"   Checkout URL: {checkout_url}")
                return True
            else:
                print(f"⚠️  Transaction creation response: {response.status_code}")
                error_data = response.json()
                print(f"   Error: {error_data}")
                
                # Check if it's a price ID issue
                if "price_id" in str(error_data):
                    print("💡 This might be because the price IDs need to be created in your Paddle dashboard")
                    print("   Create products and prices in Paddle, then update the price IDs in the code")
                
    except Exception as e:
        print(f"❌ Transaction creation test failed: {str(e)}")
    
    print()
    return True

async def test_local_api():
    """Test our local FastAPI endpoints"""
    
    print("🏠 Test 3: Local API Endpoints")
    
    try:
        async with httpx.AsyncClient() as client:
            # Test health endpoint
            response = await client.get("http://localhost:8000/health", timeout=5.0)
            
            if response.status_code == 200:
                print("✅ Local API is running!")
                
                # Test Paddle plans endpoint
                response = await client.get("http://localhost:8000/api/v1/paddle/plans", timeout=5.0)
                
                if response.status_code == 200:
                    print("✅ Paddle plans endpoint working!")
                    data = response.json()
                    if data.get("success"):
                        plans = data.get("plans", {})
                        print(f"   Available plans: {list(plans.keys())}")
                    else:
                        print(f"   Response: {data}")
                else:
                    print(f"⚠️  Paddle plans endpoint: {response.status_code}")
                    
            else:
                print(f"❌ Local API not responding: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Local API test failed: {str(e)}")
        print("💡 Make sure your FastAPI server is running: uvicorn main:app --reload")

def print_setup_instructions():
    """Print setup instructions for Paddle"""
    
    print("🚀 Paddle Integration Setup Instructions")
    print("=" * 50)
    print()
    print("1. Get your Paddle API credentials:")
    print("   • Go to https://vendors.paddle.com/")
    print("   • Navigate to Developer Tools > Authentication")
    print("   • Create or copy your API key")
    print("   • Copy your webhook secret (if using webhooks)")
    print()
    print("2. Update your .env file:")
    print("   PADDLE_API_KEY=your-paddle-api-key-here")
    print("   PADDLE_WEBHOOK_SECRET=your-webhook-secret-here")
    print("   PADDLE_ENVIRONMENT=sandbox")
    print()
    print("3. Create your subscription products in Paddle:")
    print("   • Go to Catalog > Products")
    print("   • Create products for Starter ($10), Pro ($29), Elite ($69)")
    print("   • Copy the price IDs and update them in paddle_service.py")
    print()
    print("4. Test the integration:")
    print("   python test_paddle_integration.py")
    print()

async def main():
    """Main test function"""
    
    print_setup_instructions()
    
    # Test Paddle API
    paddle_success = await test_paddle_api()
    
    # Test local API
    await test_local_api()
    
    print()
    if paddle_success:
        print("🎉 Paddle integration is ready!")
        print("💡 Next steps:")
        print("   1. Create your products and prices in Paddle dashboard")
        print("   2. Update the price IDs in paddle_service.py")
        print("   3. Test the full checkout flow")
    else:
        print("❌ Paddle integration needs configuration")
        print("💡 Please check your API credentials and try again")

if __name__ == "__main__":
    asyncio.run(main())
