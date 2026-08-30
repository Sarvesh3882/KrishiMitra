"""
Mistral AI Provider Implementation
Uses specific Mistral Agent created in Mistral Studio with function calling
"""

import os
import httpx
import logging
import json
from typing import List, Dict, Any, Optional
from .base import AIProvider

logger = logging.getLogger(__name__)


class MistralProvider(AIProvider):
    """
    Mistral AI Agent provider for KrishiMitra
    Uses a specific Mistral Agent (MISTRAL_AGENT_ID) configured in Mistral Studio
    
    IMPORTANT: This uses the Agent API, not generic chat completions.
    The Agent's instructions are managed in Mistral Studio.
    """
    
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY")
        self.agent_id = os.getenv("MISTRAL_AGENT_ID")
        self.api_base = "https://api.mistral.ai/v1"
        self.timeout = 30.0
        
    def get_provider_name(self) -> str:
        return f"Mistral Agent ({self.agent_id[:8]}...)" if self.agent_id else "Mistral Agent"
    
    def is_available(self) -> bool:
        """Check if both API key and Agent ID are configured"""
        return bool(self.api_key and self.agent_id)
    
    async def generate_response(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        language: str = "hi",
        context: Optional[Dict[str, Any]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_executor: Optional[Any] = None
    ) -> str:
        """
        Generate response using Mistral Agent API with function calling support.
        
        The Agent's behavior and instructions are configured in Mistral Studio.
        We send the conversation history, current message, and available tools.
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            language: Language code
            context: Additional context
            tools: Available tools for function calling (Mistral Agent schema format)
            tool_executor: Async function to execute tool calls
        
        Returns:
            Final response text after any tool calls
        """
        
        if not self.api_key:
            raise ValueError("Mistral API key not configured (MISTRAL_API_KEY)")
        
        if not self.agent_id:
            raise ValueError("Mistral Agent ID not configured (MISTRAL_AGENT_ID)")
        
        # Build messages for Mistral Agent
        # Agent's system instructions are in Mistral Studio, not here
        messages = []
        
        # Add conversation history
        messages.extend(conversation_history)
        
        # Add current message with optional context
        user_message = message
        
        # Optionally include context in the user message if provided
        if context:
            context_info = []
            if context.get("location"):
                context_info.append(f"Location: {context['location']}")
            if context.get("current_weather"):
                context_info.append(f"Weather: {context['current_weather']}")
            if context.get("user_crops"):
                context_info.append(f"Crops: {', '.join(context['user_crops'])}")
            
            if context_info:
                user_message = f"{message}\n\n[Context: {' | '.join(context_info)}]"
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Build request payload
        payload = {
            "agent_id": self.agent_id,
            "messages": messages,
            "max_tokens": 500  # Keep responses concise for speech
        }
        
        # Add tools if provided
        if tools:
            payload["tools"] = tools
            logger.info(f"[MISTRAL] Sending {len(tools)} tools to Agent")
        
        # Call Mistral Agent API (may loop if tool calls needed)
        max_iterations = 5  # Prevent infinite loops
        iteration = 0
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                while iteration < max_iterations:
                    iteration += 1
                    logger.info(f"[MISTRAL] API call iteration {iteration}")
                    
                    response = await client.post(
                        f"{self.api_base}/agents/completions",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        },
                        json=payload
                    )
                
                    response.raise_for_status()
                    result = response.json()
                    
                    # LOG: Inspect raw Mistral Agent response
                    logger.info(f"[MISTRAL] Raw API response keys: {list(result.keys())}")
                    logger.debug(f"[MISTRAL] Full response: {result}")
                    
                    # Extract message from response
                    if "choices" in result and len(result["choices"]) > 0:
                        choice = result["choices"][0]
                        message_obj = choice.get("message", {})
                        finish_reason = choice.get("finish_reason")
                        
                        logger.info(f"[MISTRAL] finish_reason: {finish_reason}")
                        
                        # Check if tool calls are requested
                        tool_calls = message_obj.get("tool_calls")
                        
                        if tool_calls and tool_executor:
                            # Agent is requesting tool calls
                            logger.info(f"[MISTRAL] Agent requested {len(tool_calls)} tool call(s)")
                            
                            # Execute tool calls
                            tool_results = []
                            for tool_call in tool_calls:
                                tool_id = tool_call.get("id")
                                function_call = tool_call.get("function", {})
                                function_name = function_call.get("name")
                                function_args_str = function_call.get("arguments", "{}")
                                
                                logger.info(f"[MISTRAL] Executing tool: {function_name}")
                                logger.debug(f"[MISTRAL] Tool args: {function_args_str}")
                                
                                try:
                                    # Parse arguments
                                    function_args = json.loads(function_args_str) if isinstance(function_args_str, str) else function_args_str
                                    
                                    # Execute tool
                                    tool_result = await tool_executor(function_name, function_args)
                                    
                                    logger.info(f"[MISTRAL] Tool {function_name} executed successfully")
                                    logger.debug(f"[MISTRAL] Tool result: {tool_result}")
                                    
                                    # Format result for Mistral
                                    tool_results.append({
                                        "role": "tool",
                                        "tool_call_id": tool_id,
                                        "content": json.dumps(tool_result, ensure_ascii=False)
                                    })
                                    
                                except Exception as tool_error:
                                    logger.error(f"[MISTRAL] Tool {function_name} error: {tool_error}")
                                    tool_results.append({
                                        "role": "tool",
                                        "tool_call_id": tool_id,
                                        "content": json.dumps({"error": str(tool_error)}, ensure_ascii=False)
                                    })
                            
                            # Add assistant message with tool calls to conversation
                            messages.append({
                                "role": "assistant",
                                "tool_calls": tool_calls
                            })
                            
                            # Add tool results to conversation
                            messages.extend(tool_results)
                            
                            # Update payload for next iteration
                            payload["messages"] = messages
                            
                            # Continue loop to get final response
                            continue
                        
                        # No tool calls - extract text response
                        ai_response = message_obj.get("content")
                        
                        if ai_response:
                            ai_response = ai_response.strip()
                            logger.info(f"[MISTRAL] Final response length: {len(ai_response)} chars")
                            
                            if not ai_response:
                                logger.error("[MISTRAL] Mistral Agent returned empty string after strip()")
                                raise Exception("Mistral Agent returned empty response")
                            
                            return ai_response
                        else:
                            logger.error("[MISTRAL] No content in message")
                            raise Exception("Mistral Agent returned no content")
                    
                    elif "message" in result:
                        # Direct message format
                        ai_response = result["message"].get("content")
                        if ai_response:
                            ai_response = ai_response.strip()
                            logger.info(f"[MISTRAL] Final response length: {len(ai_response)} chars")
                            return ai_response
                        else:
                            raise Exception("Mistral Agent returned empty message")
                    
                    else:
                        logger.error(f"[MISTRAL] Unexpected response format. Keys: {list(result.keys())}")
                        raise Exception(f"Unexpected Mistral Agent response format. Keys: {list(result.keys())}")
                
                # Max iterations reached
                logger.error(f"[MISTRAL] Max iterations ({max_iterations}) reached")
                raise Exception("Maximum tool call iterations reached")
                
        except httpx.TimeoutException:
            raise Exception("Mistral Agent API request timed out")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise Exception("Invalid Mistral API key")
            elif e.response.status_code == 404:
                raise Exception(f"Mistral Agent not found: {self.agent_id}")
            elif e.response.status_code == 429:
                raise Exception("Mistral API rate limit exceeded")
            else:
                error_text = e.response.text
                raise Exception(f"Mistral Agent API error: {e.response.status_code} - {error_text}")
        except Exception as e:
            raise Exception(f"Failed to generate response from Mistral Agent: {str(e)}")

