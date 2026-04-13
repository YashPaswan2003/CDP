"""Base agent class with Claude API integration."""

from anthropic import Anthropic
from app.config import settings
import logging

logger = logging.getLogger("api")


class BaseAgent:
    """Base class for all AI agents in Ethinos CDP."""

    def __init__(self, account_id: str, model: str = "claude-3-5-sonnet-20241022"):
        """Initialize agent with Anthropic client.

        Args:
            account_id: Account ID for context
            model: Claude model to use
        """
        self.account_id = account_id
        self.model = model
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.conversation_history = []
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        """Build system prompt with account context."""
        return f"""You are Claude, an AI marketing analyst for the Ethinos CDP platform.
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
        """Get response from Claude API.

        Args:
            user_message: User's message

        Returns:
            Claude's response text
        """
        # Add user message to history
        self.add_message("user", user_message)

        try:
            # Call Claude API with conversation history
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=self.system_prompt,
                messages=self.conversation_history,
            )

            # Extract response text
            assistant_message = response.content[0].text

            # Add assistant response to history
            self.add_message("assistant", assistant_message)

            logger.info(f"Agent response generated for account {self.account_id}")
            return assistant_message

        except Exception as e:
            logger.error(f"Error getting Claude response: {str(e)}")
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
