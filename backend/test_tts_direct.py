"""
Direct test of Sarvam TTS
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables FIRST
from dotenv import load_dotenv
load_dotenv()

from services.ai.sarvam.tts import sarvam_tts


async def test_tts():
    print("Testing Sarvam TTS...")
    print(f"API Key configured: {sarvam_tts.is_available()}")
    
    if not sarvam_tts.is_available():
        print("❌ Sarvam API key not configured")
        api_key = os.getenv("SARVAM_API_KEY")
        print(f"SARVAM_API_KEY from env: {api_key[:20] if api_key else 'None'}...")
        return
    
    try:
        print("\n🔊 Generating Hindi speech...")
        audio = await sarvam_tts.synthesize(
            text="नमस्कार, मैं कृषिमित्र हूं",
            language="hi-IN",
            speaker="meera"
        )
        
        print(f"✅ Audio generated: {len(audio)} bytes")
        
        # Save to file for testing
        with open("test_output.wav", "wb") as f:
            f.write(audio)
        print("✅ Saved to test_output.wav")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(test_tts())
