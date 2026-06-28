import httpx
import logging
from typing import List, Dict, Any, Optional
from config import settings

logger = logging.getLogger("chatbot")

class GeminiClient:
    """
    Client wrapper for Google Gemini API using httpx for HTTP requests.
    Supports system instructions and conversational formatting.
    """

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model = "gemini-2.5-flash"
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        system_instruction: Optional[str] = None
    ) -> str:
        """
        Sends conversation history to Gemini API and returns the generated string.
        Falls back to a friendly error description if the call fails or API key is not set.
        """
        if not self.api_key:
            logger.warning("[GeminiClient] No GEMINI_API_KEY set. Operating in dry-run/mock mode.")
            return (
                "🤖 (Mock Mode) I'm currently running without an active Gemini API key. "
                "Please configure GEMINI_API_KEY in the backend `.env` file to enable my full AI capabilities! "
                "In the meantime, you can try my quick-action buttons below to check live temple information."
            )

        headers = {
            "Content-Type": "application/json"
        }
        
        # Build request body
        payload: Dict[str, Any] = {
            "contents": messages
        }
        
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        url = f"{self.base_url}?key={self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                
                if response.status_code != 200:
                    logger.error(f"[GeminiClient] API error: {response.status_code} - {response.text}")
                    return (
                        "I am having trouble reaching my AI services right now. "
                        "Please try again or use the quick action buttons for direct info."
                    )

                data = response.json()
                
                # Parse response
                candidates = data.get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
                
                logger.warning(f"[GeminiClient] Unexpected API response format: {data}")
                return "I received an empty response. How else can I assist you today?"

        except httpx.RequestError as exc:
            logger.error(f"[GeminiClient] Network error: {exc}")
            return "I am experiencing network issues connecting to my AI services. Please try again shortly."
        except Exception as e:
            logger.error(f"[GeminiClient] Unexpected error: {e}")
            return "An unexpected error occurred while processing your request."

llm_client = GeminiClient()
