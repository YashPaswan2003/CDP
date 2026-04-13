"""Insights agent for chat and campaign analysis."""

from app.services.agents.base_agent import BaseAgent
from app.database.connection import get_connection
import logging

logger = logging.getLogger("api")


class InsightsAgent(BaseAgent):
    """Agent specialized in campaign insights and analysis."""

    def __init__(self, account_id: str, context: dict = None):
        """Initialize insights agent with optional context.

        Args:
            account_id: Account ID
            context: Optional context dict with campaigns, metrics, flags, config
        """
        super().__init__(account_id)
        self.context = context or {}
        self._build_context_aware_prompt()

    def _build_context_aware_prompt(self):
        """Build system prompt with context about account metrics."""
        base_prompt = self.system_prompt

        # Add context about current campaigns if available
        if self.context.get("campaigns"):
            campaigns_info = self._format_campaigns(self.context["campaigns"])
            base_prompt += f"\n\nCurrent Campaigns:\n{campaigns_info}"

        # Add context about flags/anomalies if available
        if self.context.get("flags"):
            flags_info = self._format_flags(self.context["flags"])
            base_prompt += f"\n\nActive Alerts:\n{flags_info}"

        # Add context about config thresholds
        if self.context.get("config"):
            config_info = self._format_config(self.context["config"])
            base_prompt += f"\n\nAccount Configuration:\n{config_info}"

        self.system_prompt = base_prompt

    def _format_campaigns(self, campaigns: list) -> str:
        """Format campaigns for context."""
        if not campaigns:
            return "No campaigns available"

        lines = []
        for camp in campaigns[:5]:  # Limit to 5 campaigns for context window
            lines.append(
                f"- {camp.get('name', 'Unknown')}: "
                f"${camp.get('spent', 0):.2f} spend, "
                f"ROAS {camp.get('roas', 0):.2f}x"
            )
        return "\n".join(lines)

    def _format_flags(self, flags: list) -> str:
        """Format flags for context."""
        if not flags:
            return "No active alerts"

        lines = []
        for flag in flags[:5]:  # Limit to 5 flags
            lines.append(
                f"- {flag.get('severity', 'medium').upper()}: "
                f"{flag.get('metric', 'unknown')} — {flag.get('explanation', '')[:100]}"
            )
        return "\n".join(lines)

    def _format_config(self, config: dict) -> str:
        """Format configuration for context."""
        return f"""ROAS Target: {config.get('roas_threshold', 3.0)}x
CPA Limit: ${config.get('cpa_threshold', 'Not set')}
Quality Score Min: {config.get('quality_score_threshold', 7)}
Frequency Limit: {config.get('frequency_threshold', 5.0)}x
Currency: {config.get('currency', 'INR')}"""

    def chat(self, user_message: str) -> str:
        """Get AI response for user message.

        Args:
            user_message: User's chat message

        Returns:
            Claude's response
        """
        return self.get_response(user_message)

    def analyze_campaign(self, campaign_id: str) -> str:
        """Analyze specific campaign performance.

        Args:
            campaign_id: Campaign ID to analyze

        Returns:
            Analysis from Claude
        """
        analysis_prompt = f"""Please analyze campaign {campaign_id} and provide:
1. Performance summary (vs targets)
2. Main issues or opportunities
3. Specific optimization recommendations
4. Quick wins (actionable today)
5. 30-day forecast"""

        return self.get_response(analysis_prompt)

    def get_optimization_suggestions(self) -> str:
        """Get AI-generated optimization suggestions for account.

        Returns:
            Optimization suggestions from Claude
        """
        suggestions_prompt = """Based on current campaign performance and alerts:
1. List the top 3 optimization opportunities
2. For each, explain the expected impact (% improvement)
3. Provide step-by-step implementation guide
4. Suggest which campaigns should be prioritized
5. Estimate timeline to see results"""

        return self.get_response(suggestions_prompt)

    def summarize_performance(self, date_range: str = "last_7_days") -> str:
        """Summarize account performance.

        Args:
            date_range: Time period to summarize

        Returns:
            Performance summary from Claude
        """
        summary_prompt = f"""Provide a brief executive summary of account performance for {date_range}:
1. Key metrics (spend, revenue, ROAS, efficiency)
2. Top performing campaigns
3. Areas of concern
4. Trend direction (improving/declining)"""

        return self.get_response(summary_prompt)
