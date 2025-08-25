#!/usr/bin/env python3
"""
Simple test script to verify Brevo API is working correctly.
This will help us debug the email sending issue.
"""

import os
import requests
import json

# Read environment variables from .env file manually
def load_env_file():
    env_vars = {}
    try:
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print("⚠️ .env file not found")
    return env_vars

# Load environment variables
env_vars = load_env_file()

def test_brevo_api():
    """Test Brevo API with a simple email send"""
    
    # Get API key from environment
    api_key = env_vars.get('BREVO_API_KEY')
    sender_email = env_vars.get('BREVO_SENDER_EMAIL', 'elmimoha0@gmail.com')
    sender_name = env_vars.get('BREVO_SENDER_NAME', 'Podion AI')
    
    if not api_key:
        print("❌ BREVO_API_KEY not found in environment")
        return False
    
    print(f"🔑 Using API Key: {api_key[:20]}...")
    print(f"📧 Sender Email: {sender_email}")
    print(f"👤 Sender Name: {sender_name}")
    
    # Brevo API endpoint
    url = "https://api.brevo.com/v3/smtp/email"
    
    # Headers as specified in Brevo documentation
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    
    # Simple test email payload
    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": sender_email,  # Send to yourself for testing
                "name": "Test User"
            }
        ],
        "subject": "Brevo API Test - Podion AI",
        "htmlContent": """
        <html>
            <head></head>
            <body>
                <h2>🎉 Brevo API Test Successful!</h2>
                <p>Hello,</p>
                <p>This is a test email sent from <strong>Podion AI</strong> using the Brevo API.</p>
                <p>If you received this email, the Brevo integration is working correctly!</p>
                <br>
                <p>Best regards,<br>Podion AI Team</p>
            </body>
        </html>
        """,
        "textContent": "Brevo API Test - If you received this email, the Brevo integration is working correctly!"
    }
    
    print("\n🚀 Sending test email...")
    print(f"📤 To: {sender_email}")
    print(f"📋 Subject: {payload['subject']}")
    
    try:
        # Make the API request
        response = requests.post(url, headers=headers, json=payload)
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Email sent successfully!")
            print(f"📨 Message ID: {result.get('messageId', 'N/A')}")
            return True
        else:
            print(f"❌ Failed to send email")
            print(f"🔍 Error Response: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                print(f"📋 Error Details: {json.dumps(error_data, indent=2)}")
            except:
                print("📋 Could not parse error response as JSON")
            
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Brevo API Integration...")
    print("=" * 50)
    
    success = test_brevo_api()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Brevo API test completed successfully!")
        print("✅ Your email integration should work now.")
    else:
        print("❌ Brevo API test failed.")
        print("🔧 Please check the error messages above and:")
        print("   1. Verify your sender email in Brevo dashboard")
        print("   2. Check your API key permissions")
        print("   3. Ensure your account is not rate limited")
