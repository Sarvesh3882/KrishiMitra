"""
AI Chat API Routes for KrishiMitra
Speech-first multilingual chatbot endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import base64
import logging

from models.ai import (
    ChatRequest, ChatResponse,
    VoiceResponse,
    ConversationDetail, ConversationListResponse,
    AIStatusResponse, ServiceStatus,
    ErrorResponse
)
from services.ai.orchestrator import ai_orchestrator
from services.ai.sarvam import sarvam_stt, sarvam_tts, sarvam_language

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["AI Chat"])


# ============================================
# Text Chat Endpoint
# ============================================

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Text chat with KrishiMitra AI
    
    Flow:
    1. User sends text message
    2. AI generates response (Mistral)
    3. Convert response to speech (Sarvam TTS)
    4. Return both text and audio
    """
    
    try:
        # Normalize language code
        language_code = sarvam_language.normalize_language_code(request.language)
        
        # Generate AI response
        result = await ai_orchestrator.generate_response(
            message=request.message,
            conversation_id=request.conversation_id,
            language=request.language,
            context=request.context
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to generate response")
            )
        
        response_text = result["response_text"]
        conversation_id = result["conversation_id"]
        
        # Extract navigation action if available
        navigation = None  # Will be enhanced if needed
        
        # Generate speech from response
        audio_base64 = None
        try:
            if sarvam_tts.is_available():
                audio_bytes = await sarvam_tts.synthesize(
                    text=response_text,
                    language=language_code,
                    pace=1.0
                )
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        except Exception as tts_error:
            logger.error(f"TTS error: {tts_error}")
            # Continue without audio - text response is still valid
        
        return ChatResponse(
            success=True,
            response_text=response_text,
            audio_base64=audio_base64,
            conversation_id=conversation_id,
            language=request.language,
            provider=result.get("provider", "unknown"),
            navigation=navigation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Voice Chat Endpoint
# ============================================

@router.post("/voice", response_model=VoiceResponse)
async def voice_chat(
    audio: UploadFile = File(..., description="Audio file (wav, mp3, etc.)"),
    conversation_id: Optional[str] = Form(None),
    language: str = Form("hi-IN")
):
    """
    Voice chat with KrishiMitra AI
    
    Flow:
    1. User sends voice recording
    2. Transcribe speech to text (Sarvam STT)
    3. AI generates response (Mistral)
    4. Convert response to speech (Sarvam TTS)
    5. Return transcript, response text, and response audio
    """
    
    try:
        # Read audio file
        audio_bytes = await audio.read()
        
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Step 1: Speech to Text
        if not sarvam_stt.is_available():
            raise HTTPException(status_code=503, detail="Speech-to-text service not available")
        
        try:
            stt_result = await sarvam_stt.transcribe(
                audio_data=audio_bytes,
                language=language
            )
            transcript = stt_result["transcript"]
            
            # LOG: STT Result
            logger.info(f"[VOICE] STT transcript: '{transcript}'")
            
            if not transcript or transcript.strip() == "":
                raise HTTPException(status_code=400, detail="Could not transcribe audio. Please speak clearly and try again.")
                
        except Exception as stt_error:
            logger.error(f"[VOICE] STT error: {stt_error}")
            raise HTTPException(status_code=500, detail=f"Speech recognition failed: {str(stt_error)}")
        
        # Step 2: Generate AI response
        language_simple = language.split("-")[0]  # hi-IN -> hi
        
        result = await ai_orchestrator.generate_response(
            message=transcript,
            conversation_id=conversation_id,
            language=language_simple,
            context=None
        )
        
        if not result.get("success"):
            logger.error(f"[VOICE] Mistral Agent failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to generate response")
            )
        
        response_text = result["response_text"]
        conversation_id = result["conversation_id"]
        
        # LOG: Mistral Agent Response
        logger.info(f"[VOICE] Mistral Agent response: '{response_text}'")
        logger.info(f"[VOICE] Response type: {type(response_text)}, length: {len(response_text) if response_text else 0}")
        
        # VALIDATE: Response must not be empty
        if not response_text or not response_text.strip():
            logger.error("[VOICE] Mistral Agent returned an empty response; TTS was not called")
            raise HTTPException(
                status_code=500,
                detail="AI generated an empty response. This is a bug in the Mistral Agent integration."
            )
        
        # Extract navigation action if available (from last tool call context)
        # Navigation is stored in the orchestrator's tool execution context
        # For now, we'll parse it from the conversation metadata if needed
        navigation = None  # Will be enhanced in future if needed
        
        # Step 3: Text to Speech
        if not sarvam_tts.is_available():
            raise HTTPException(status_code=503, detail="Text-to-speech service not available")
        
        try:
            # LOG: Before TTS
            logger.info(f"[VOICE] Sending text to Sarvam TTS (length: {len(response_text)} chars)")
            
            audio_bytes = await sarvam_tts.synthesize(
                text=response_text,
                language=language,
                pace=1.0
            )
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # LOG: TTS Success
            logger.info(f"[VOICE] TTS success (audio size: {len(audio_base64)} base64 chars)")
            
        except Exception as tts_error:
            logger.error(f"[VOICE] TTS error: {tts_error}")
            raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(tts_error)}")
        
        return VoiceResponse(
            success=True,
            transcript=transcript,
            response_text=response_text,
            audio_base64=audio_base64,
            conversation_id=conversation_id,
            language=language,
            provider=result.get("provider", "unknown"),
            navigation=navigation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[VOICE] Voice chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Conversation Management
# ============================================

@router.post("/conversation/new")
async def create_conversation(language: str = "hi", user_id: Optional[str] = None):
    """Create a new conversation"""
    try:
        conversation_id = ai_orchestrator.create_conversation(
            language=language,
            user_id=user_id
        )
        
        return {
            "success": True,
            "conversation_id": conversation_id,
            "language": language
        }
    except Exception as e:
        logger.error(f"Create conversation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str):
    """Get full conversation details"""
    try:
        conversation = ai_orchestrator.get_conversation(conversation_id)
        
        if not conversation.get("messages"):
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return ConversationDetail(**conversation)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get conversation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    try:
        deleted = ai_orchestrator.delete_conversation(conversation_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {
            "success": True,
            "message": "Conversation deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete conversation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(user_id: Optional[str] = None, limit: int = 10):
    """List recent conversations"""
    try:
        conversations = ai_orchestrator.conversation_manager.get_recent_conversations(
            user_id=user_id,
            limit=limit
        )
        
        return ConversationListResponse(
            conversations=conversations,
            total=len(conversations)
        )
        
    except Exception as e:
        logger.error(f"List conversations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# System Status
# ============================================

@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    """Get AI system status"""
    try:
        mistral = ai_orchestrator.mistral
        kisan_slm = ai_orchestrator.kisan_slm
        
        return AIStatusResponse(
            mistral=ServiceStatus(
                name="Mistral",
                available=mistral.is_available(),
                configured=mistral.is_available(),
                message="Ready" if mistral.is_available() else "API key not configured"
            ),
            kisan_slm=ServiceStatus(
                name="Kisan SLM",
                available=kisan_slm.is_available(),
                configured=False,
                message="Not yet implemented - using Mistral"
            ),
            sarvam_stt=ServiceStatus(
                name="Sarvam STT (Saaras)",
                available=sarvam_stt.is_available(),
                configured=sarvam_stt.is_available(),
                message="Ready" if sarvam_stt.is_available() else "API key not configured"
            ),
            sarvam_tts=ServiceStatus(
                name="Sarvam TTS (Bulbul)",
                available=sarvam_tts.is_available(),
                configured=sarvam_tts.is_available(),
                message="Ready" if sarvam_tts.is_available() else "API key not configured"
            ),
            default_provider="mistral",
            supported_languages=sarvam_stt.get_supported_languages()
        )
        
    except Exception as e:
        logger.error(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
