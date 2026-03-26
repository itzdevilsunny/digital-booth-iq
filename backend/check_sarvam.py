import os
import httpx
import asyncio
from dotenv import load_dotenv
from pathlib import Path

async def check_sarvam_limit():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    sarvam_key = os.environ.get('SARVAM_API_KEY')
    if not sarvam_key:
        print("❌ SARVAM_API_KEY not found in .env")
        return

    print(f"🔍 Testing Sarvam AI API Key: {sarvam_key[:5]}...{sarvam_key[-5:]}")
    
    # Test Chat Completion (Lightweight test)
    async with httpx.AsyncClient() as client:
        headers = {
            'api-subscription-key': sarvam_key,
            'Content-Type': 'application/json'
        }
        payload = {
            "model": "sarvam-m",
            "messages": [
                {"role": "user", "content": "Hi"}
            ]
        }
        
        try:
            print("📡 Sending test request to Sarvam AI...")
            response = await client.post(
                "https://api.sarvam.ai/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=10.0
            )
            
            print(f"📊 Status Code: {response.status_code}")
            if response.status_code == 200:
                print("✅ Sarvam AI is ACTIVE and within limits.")
                print(f"💬 Response: {response.json()['choices'][0]['message']['content'][:50]}...")
            elif response.status_code == 429:
                print("⚠️ Sarvam AI is at RATE LIMIT (429 Too Many Requests).")
            elif response.status_code == 401:
                print("❌ Sarvam AI API Key is INVALID (401 Unauthorized).")
            elif response.status_code == 403:
                print("❌ Sarvam AI access FORBIDDEN (403 Forbidden). Check subscription.")
            else:
                print(f"❓ Unexpected response: {response.status_code}")
                print(f"📝 Body: {response.text}")
                
        except Exception as e:
            print(f"💥 Connection Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_sarvam_limit())
