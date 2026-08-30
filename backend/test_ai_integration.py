"""
Test script for KrishiMitra AI Integration
Tests Mistral Agent + Sarvam AI integration
"""

import asyncio
import httpx
import json
from datetime import datetime


BASE_URL = "http://localhost:8000/api/v1"


async def test_status():
    """Test AI services status"""
    print("\n" + "="*60)
    print("TEST 1: AI Services Status")
    print("="*60)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/ai/status")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Status endpoint working")
            print(f"\nMistral: {'✅' if data['mistral']['available'] else '❌'} {data['mistral']['message']}")
            print(f"Sarvam STT: {'✅' if data['sarvam_stt']['available'] else '❌'} {data['sarvam_stt']['message']}")
            print(f"Sarvam TTS: {'✅' if data['sarvam_tts']['available'] else '❌'} {data['sarvam_tts']['message']}")
            print(f"\nDefault Provider: {data['default_provider']}")
            print(f"Supported Languages: {len(data['supported_languages'])} languages")
            return True
        else:
            print(f"❌ Status check failed: {response.status_code}")
            return False


async def test_simple_chat():
    """Test simple text chat"""
    print("\n" + "="*60)
    print("TEST 2: Simple Text Chat (Hindi)")
    print("="*60)
    
    payload = {
        "message": "नमस्कार",
        "language": "hi"
    }
    
    print(f"Request: {payload['message']}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/ai/chat",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Chat endpoint working")
                print(f"\nResponse: {data['response_text']}")
                print(f"Language: {data['language']}")
                print(f"Conversation ID: {data['conversation_id']}")
                print(f"Audio provided: {'✅ Yes' if data.get('audio_base64') else '❌ No'}")
                return True, data['conversation_id']
            else:
                print(f"❌ Chat failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False, None
                
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False, None


async def test_agriculture_question():
    """Test agriculture-specific question"""
    print("\n" + "="*60)
    print("TEST 3: Agriculture Question (Hindi)")
    print("="*60)
    
    payload = {
        "message": "गेहूं की खेती के लिए सबसे अच्छा मौसम कौन सा है?",
        "language": "hi"
    }
    
    print(f"Request: {payload['message']}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/ai/chat",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Agriculture question answered")
                print(f"\nResponse: {data['response_text']}")
                print(f"Response length: {len(data['response_text'])} chars")
                return True, data['conversation_id']
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False, None
                
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False, None


async def test_conversation_history(conversation_id):
    """Test conversation history continuation"""
    print("\n" + "="*60)
    print("TEST 4: Conversation History")
    print("="*60)
    
    if not conversation_id:
        print("⏭️  Skipping (no conversation ID from previous test)")
        return False
    
    payload = {
        "message": "और बारिश के बारे में क्या सलाह है?",
        "language": "hi",
        "conversation_id": conversation_id
    }
    
    print(f"Request: {payload['message']}")
    print(f"Using conversation: {conversation_id}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/ai/chat",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Follow-up question answered")
                print(f"\nResponse: {data['response_text']}")
                return True
            else:
                print(f"❌ Failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


async def test_english_chat():
    """Test English language support"""
    print("\n" + "="*60)
    print("TEST 5: English Language")
    print("="*60)
    
    payload = {
        "message": "What crops grow well in monsoon?",
        "language": "en"
    }
    
    print(f"Request: {payload['message']}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/ai/chat",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ English chat working")
                print(f"\nResponse: {data['response_text']}")
                return True
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


async def test_context_injection():
    """Test context injection (location, weather)"""
    print("\n" + "="*60)
    print("TEST 6: Context Injection")
    print("="*60)
    
    payload = {
        "message": "मुझे अपनी फसल के लिए सलाह चाहिए",
        "language": "hi",
        "context": {
            "location": "Kopergaon, Maharashtra",
            "current_weather": "बारिश की संभावना",
            "user_crops": ["गेहूं", "धान"]
        }
    }
    
    print(f"Request: {payload['message']}")
    print(f"Context: {payload['context']}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/ai/chat",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Context injection working")
                print(f"\nResponse: {data['response_text']}")
                print(f"\n💡 Check if response mentions location/weather/crops")
                return True
            else:
                print(f"❌ Failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🌾 KrishiMitra AI Integration Tests")
    print("="*60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backend: {BASE_URL}")
    
    results = []
    conversation_id = None
    
    # Test 1: Status
    result = await test_status()
    results.append(("Status Check", result))
    
    if not result:
        print("\n❌ Backend not ready. Please ensure:")
        print("   1. Backend is running on port 8000")
        print("   2. API keys configured in .env")
        return
    
    # Test 2: Simple chat
    result, conv_id = await test_simple_chat()
    results.append(("Simple Chat", result))
    if conv_id:
        conversation_id = conv_id
    
    # Test 3: Agriculture question
    result, conv_id = await test_agriculture_question()
    results.append(("Agriculture Question", result))
    if conv_id and not conversation_id:
        conversation_id = conv_id
    
    # Test 4: Conversation history
    result = await test_conversation_history(conversation_id)
    results.append(("Conversation History", result))
    
    # Test 5: English
    result = await test_english_chat()
    results.append(("English Language", result))
    
    # Test 6: Context injection
    result = await test_context_injection()
    results.append(("Context Injection", result))
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "-"*60)
    print(f"Total: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 All tests passed! AI integration is working perfectly!")
        print("\n📱 Next: Test the frontend at http://localhost:5173/ai")
    elif passed > 0:
        print("\n⚠️  Some tests failed. Check the errors above.")
        print("\n💡 Common issues:")
        print("   - WebSearchTool enabled in Mistral Agent (disable it)")
        print("   - Invalid API keys")
        print("   - Agent ID incorrect")
    else:
        print("\n❌ All tests failed. Check:")
        print("   - Backend server running?")
        print("   - API keys configured?")
        print("   - Mistral Agent accessible?")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⏸️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {str(e)}")
