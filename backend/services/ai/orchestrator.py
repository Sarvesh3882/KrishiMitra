"""
AI Orchestrator for KrishiMitra
Coordinates AI providers, conversation management, context, and tool calling
"""

import os
import logging
from typing import Dict, Any, Optional, List, Callable
from .providers import AIProvider, MistralProvider, KisanSLMProvider
from .conversation import conversation_manager
from .tools import ALL_TOOLS, TOOL_FUNCTIONS

logger = logging.getLogger(__name__)


class AIOrchestrator:
    """
    Central orchestrator for AI operations
    
    Responsibilities:
    - Select appropriate AI provider
    - Manage conversation context
    - Coordinate between different AI services
    """
    
    def __init__(self):
        # Initialize providers
        self.mistral = MistralProvider()
        self.kisan_slm = KisanSLMProvider()
        
        # Default provider
        self.default_provider = "mistral"
        
        # Conversation manager
        self.conversation_manager = conversation_manager
        
        # Tools registry
        self.tools = ALL_TOOLS
        self.tool_functions = TOOL_FUNCTIONS
        
        # Tool executor
        self.tool_executor = self._create_tool_executor()
    
    def _create_tool_executor(self) -> Callable:
        """
        Create async tool executor function for Mistral provider.
        
        Returns:
            Async function that executes tool calls
        """
        async def execute_tool(function_name: str, function_args: Dict[str, Any]) -> Dict[str, Any]:
            """
            Execute a tool function by name with given arguments.
            
            Args:
                function_name: Name of the tool function
                function_args: Arguments to pass to the function
                
            Returns:
                Tool execution result
            """
            logger.info(f"[ORCHESTRATOR:TOOL] Executing {function_name} with args: {function_args}")
            
            if function_name not in self.tool_functions:
                logger.error(f"[ORCHESTRATOR:TOOL] Unknown tool: {function_name}")
                return {
                    "status": "error",
                    "message": f"Unknown tool: {function_name}"
                }
            
            try:
                tool_func = self.tool_functions[function_name]
                result = await tool_func(**function_args)
                
                logger.info(f"[ORCHESTRATOR:TOOL] Tool {function_name} returned status: {result.get('status')}")
                return result
                
            except Exception as e:
                logger.error(f"[ORCHESTRATOR:TOOL] Tool {function_name} error: {e}")
                return {
                    "status": "error",
                    "message": f"Tool execution error: {str(e)}"
                }
        
        return execute_tool
    
    def get_provider(self, provider_name: Optional[str] = None) -> AIProvider:
        """
        Get AI provider instance
        
        Args:
            provider_name: "mistral" or "kisan_slm". If None, uses default.
            
        Returns:
            AIProvider instance
        """
        if provider_name is None:
            provider_name = self.default_provider
        
        if provider_name == "mistral":
            if not self.mistral.is_available():
                raise ValueError("Mistral provider is not configured. Please set MISTRAL_API_KEY.")
            return self.mistral
        
        elif provider_name == "kisan_slm":
            if not self.kisan_slm.is_available():
                raise ValueError("Kisan SLM provider is not yet available.")
            return self.kisan_slm
        
        else:
            raise ValueError(f"Unknown provider: {provider_name}")
    
    async def generate_response(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        language: str = "hi",
        context: Optional[Dict[str, Any]] = None,
        provider_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate AI response for a message
        
        Args:
            message: User's input message
            conversation_id: Conversation ID (creates new if None)
            language: Language code (hi, mr, en)
            context: Additional context (location, weather, etc.)
            provider_name: AI provider to use
            
        Returns:
            Dictionary with response_text, conversation_id, and metadata
        """
        
        # Create or get conversation
        if conversation_id is None:
            conversation_id = self.conversation_manager.create_conversation(
                language=language
            )
        
        # Get conversation history
        conversation_history = self.conversation_manager.get_conversation_history(
            conversation_id,
            limit=20  # Last 20 messages for context
        )
        
        # Get AI provider
        provider = self.get_provider(provider_name)
        
        # Generate response with tool calling support
        try:
            # Determine if tools should be provided
            # For now, always provide tools to Mistral Agent
            tools = self.tools if provider_name == "mistral" or provider_name is None else None
            tool_executor = self.tool_executor if tools else None
            
            if tools:
                logger.info(f"[ORCHESTRATOR] Providing {len(tools)} tools to {provider.get_provider_name()}")
            
            # Generate response (may include tool calls)
            response_text = await provider.generate_response(
                message=message,
                conversation_history=conversation_history,
                language=language,
                context=context,
                tools=tools,
                tool_executor=tool_executor
            )
            
            # LOG: Orchestrator received response
            logger.info(f"[ORCHESTRATOR] Received final response from {provider.get_provider_name()}")
            logger.info(f"[ORCHESTRATOR] Response type: {type(response_text)}, length: {len(response_text) if response_text else 0}")
            
            # Validate response
            if not response_text:
                logger.error(f"[ORCHESTRATOR] Provider {provider.get_provider_name()} returned empty/None response")
                raise Exception(f"Provider {provider.get_provider_name()} returned empty response")
            
            # Store messages in conversation
            self.conversation_manager.add_message(
                conversation_id=conversation_id,
                role="user",
                content=message,
                message_type="text"
            )
            
            self.conversation_manager.add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=response_text,
                message_type="text"
            )
            
            # Return response without navigation (routes will extract navigation from context)
            return {
                "success": True,
                "response_text": response_text,
                "conversation_id": conversation_id,
                "provider": provider.get_provider_name(),
                "language": language
            }
            
        except Exception as e:
            # Log and return error response
            logger.error(f"[ORCHESTRATOR] Error generating response: {e}")
            return {
                "success": False,
                "error": str(e),
                "conversation_id": conversation_id,
                "provider": provider.get_provider_name() if provider else "unknown"
            }
    
    def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """
        Get full conversation details
        """
        messages = self.conversation_manager.get_full_conversation(conversation_id)
        metadata = self.conversation_manager.get_conversation_metadata(conversation_id)
        
        return {
            "conversation_id": conversation_id,
            "messages": messages,
            "metadata": metadata
        }
    
    def create_conversation(
        self,
        language: str = "hi",
        user_id: Optional[str] = None
    ) -> str:
        """Create a new conversation"""
        return self.conversation_manager.create_conversation(
            language=language,
            user_id=user_id
        )
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation"""
        return self.conversation_manager.delete_conversation(conversation_id)


# Global orchestrator instance
ai_orchestrator = AIOrchestrator()
