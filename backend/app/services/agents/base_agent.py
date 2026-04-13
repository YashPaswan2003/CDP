"""Base agent class with OpenRouter API integration."""

from openai import OpenAI
from app.config import settings
import os
import logging

logger = logging.getLogger("api")


class BaseAgent:
    """Base class for all AI agents in Ethinos CDP using OpenRouter API."""

    def __init__(self, account_id: str, model: str = "google/gemma-4-31b-it:free"):
        """Initialize agent with OpenRouter client (Gemma 4 31B free tier).

        Args:
            account_id: Account ID for context
            model: OpenRouter model to use (default: Gemma 4 31B free)
        """
        self.account_id = account_id
        self.model = model
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            logger.warning("OPENROUTER_API_KEY environment variable not set")
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        self.conversation_history = []
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        """Build system prompt with account context."""
        return f"""You are Gemma, an AI marketing analyst for the Ethinos CDP platform.
You help analyze campaign performance, identify optimization opportunities, and provide actionable insights.

Account ID: {self.account_id}

Guidelines:
- Be concise and actionable in your responses
- Use data-driven analysis and metrics
- Provide specific recommendations with reasoning
- Reference campaigns, keywords, and metrics when discussing performance
- Suggest actions that can be executed immediately
- Acknowledge limitations in your analysis based on available data
- Maintain context across conversation history

Available tools and data:
- Campaign metrics: spend, impressions, clicks, conversions, ROAS, CTR, CVR, CPC
- Anomaly detection: real-time alerts and flags on performance drops
- Historical comparisons: month-over-month, week-over-week analysis
- Client configuration: threshold settings for alerts and recommendations"""

    def add_message(self, role: str, content: str):
        """Add message to conversation history."""
        self.conversation_history.append({"role": role, "content": content})

    def get_response(self, user_message: str) -> str:
        """Get response from OpenRouter API (Gemma 4 31B).

        Args:
            user_message: User's message

        Returns:
            Gemma's response text
        """
        # Add user message to history
        self.add_message("user", user_message)

        try:
            # Call OpenRouter API with conversation history
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=2048,
                system=self.system_prompt,
                messages=self.conversation_history,
            )

            # Extract response text
            assistant_message = response.choices[0].message.content

            # Add assistant response to history
            self.add_message("assistant", assistant_message)

            logger.info(f"Agent response generated for account {self.account_id}")
            return assistant_message

        except Exception as e:
            logger.error(f"Error getting OpenRouter response: {str(e)}")
            raise

    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []

    def count_tokens(self, text: str) -> int:
        """Estimate token count for text (approximate).

        Args:
            text: Text to count tokens for

        Returns:
            Approximate token count
        """
        # Rough estimate: 1 token ≈ 4 characters
        return len(text) // 4
