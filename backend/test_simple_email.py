#!/usr/bin/env python3
"""
Send a very simple test email to make it easy to find in Gmail
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

def send_simple_test_email():
    """Send a very simple test email"""
    
    api_key = env_vars.get('BREVO_API_KEY')
    sender_email = env_vars.get('BREVO_SENDER_EMAIL', 'elmimoha15@gmail.com')
    sender_name = env_vars.get('BREVO_SENDER_NAME', 'Podion AI')
    
    if not api_key:
        print("❌ BREVO_API_KEY not found")
        return False
    
    print(f"📧 Sending simple test email...")
    print(f"📤 From: {sender_name} <{sender_email}>")
    print(f"📥 To: {sender_email}")
    
    # Brevo API endpoint
    url = "https://api.brevo.com/v3/smtp/email"
    
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    
    # Very simple email payload
    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": sender_email,
                "name": "Test User"
            }
        ],
        "subject": "🧪 SIMPLE TEST EMAIL - PLEASE CHECK",
        "htmlContent": """
        <html>
            <body>
                <h1>🧪 TEST EMAIL SUCCESS!</h1>
                <p><strong>This is a simple test email from Podion AI.</strong></p>
                <p>If you can see this email, the Brevo integration is working perfectly!</p>
                <p>Subject: SIMPLE TEST EMAIL - PLEASE CHECK</p>
                <p>Time sent: """ + str(env_vars) + """</p>
            </body>
        </html>
        """,
        "textContent": "🧪 TEST EMAIL SUCCESS! This is a simple test email from Podion AI. If you can see this, the integration works!"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            message_id = result.get('messageId', 'N/A')
            print(f"✅ Email sent successfully!")
            print(f"📨 Message ID: {message_id}")
            print(f"🔍 Search Gmail for: 'SIMPLE TEST EMAIL'")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Sending Simple Test Email...")
    print("=" * 50)
    
    success = send_simple_test_email()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Test email sent!")
        print("📧 CHECK YOUR GMAIL INBOX for: 'SIMPLE TEST EMAIL'")
        print("🔍 Also check: Spam, Promotions, All Mail")
    else:
        print("❌ Test failed")
