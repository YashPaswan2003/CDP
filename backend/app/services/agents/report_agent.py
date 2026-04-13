"""Report generation agent for presentations."""

from app.services.agents.base_agent import BaseAgent
import logging

logger = logging.getLogger("api")


class ReportAgent(BaseAgent):
    """Agent specialized in generating presentation content and reports."""

    def __init__(self, account_id: str, client_name: str = "Client"):
        """Initialize report agent.

        Args:
            account_id: Account ID
            client_name: Client name for report
        """
        super().__init__(account_id)
        self.client_name = client_name
        self._customize_report_prompt()

    def _customize_report_prompt(self):
        """Customize prompt for report generation."""
        self.system_prompt = f"""You are a marketing report specialist for {self.client_name} account ({self.account_id}).
Generate professional, executive-ready report content with:
- Clear structure and headings
- Data-driven insights and trends
- Actionable recommendations
- Professional tone for client presentations
- Metrics explained in business context (not just numbers)

Format recommendations with specific actions and expected ROI when possible."""

    def generate_executive_summary(self, metrics: dict) -> str:
        """Generate executive summary for report.

        Args:
            metrics: Dict with account metrics

        Returns:
            Executive summary text
        """
        metrics_str = self._format_metrics(metrics)

        prompt = f"""Generate a compelling executive summary for {self.client_name}'s marketing report:

Metrics:
{metrics_str}

Include:
1. Overall performance headline (1 sentence)
2. Key achievements (2-3 bullet points)
3. Areas for growth (2-3 bullet points)
4. Recommended focus for next period
5. Expected impact if recommendations are implemented"""

        return self.get_response(prompt)

    def generate_performance_section(self, metrics: dict, period: str = "month") -> str:
        """Generate performance analysis section.

        Args:
            metrics: Dict with performance metrics
            period: Time period covered

        Returns:
            Performance section text
        """
        metrics_str = self._format_metrics(metrics)

        prompt = f"""Write a detailed performance analysis section for {self.client_name}'s {period} report:

{metrics_str}

Structure:
1. Overall Performance (headline metric: ROAS, efficiency, etc.)
2. Channel Breakdown (Google, DV360, Meta performance comparison)
3. Campaign Highlights (top 3 performing and bottom 3 underperforming)
4. Key Metrics Analysis (what changed, why, impact)
5. Trend Analysis (is performance improving or declining?)"""

        return self.get_response(prompt)

    def generate_recommendations_section(self, metrics: dict, flags: list = None) -> str:
        """Generate recommendations section for report.

        Args:
            metrics: Dict with performance metrics
            flags: List of detected anomalies/flags

        Returns:
            Recommendations section text
        """
        prompt = f"""Create an actionable recommendations section for {self.client_name}'s report:

Current Performance:
{self._format_metrics(metrics)}"""

        if flags:
            prompt += f"\n\nDetected Issues:\n{self._format_flags(flags)}"

        prompt += """

Provide:
1. Top 3 recommended actions ranked by impact
2. For each action:
   - Specific implementation steps
   - Expected performance improvement (%)
   - Timeline to implement
   - Resource requirements
3. Quick wins that can be done this week
4. Strategic initiatives for next quarter"""

        return self.get_response(prompt)

    def generate_forecast_section(self, metrics: dict, trend: str = "stable") -> str:
        """Generate performance forecast for report.

        Args:
            metrics: Historical metrics
            trend: Current trend (improving/declining/stable)

        Returns:
            Forecast section text
        """
        prompt = f"""Create a forward-looking forecast section for {self.client_name}'s report:

Current Status: {trend}
Current Metrics:
{self._format_metrics(metrics)}

Generate:
1. 30-day performance forecast (optimistic, realistic, pessimistic scenarios)
2. 90-day outlook with recommendations implemented
3. Confidence level for each forecast
4. Key variables that could affect forecast
5. Mitigation strategies for downside scenarios"""

        return self.get_response(prompt)

    def _format_metrics(self, metrics: dict) -> str:
        """Format metrics dictionary for prompts."""
        lines = []
        for key, value in metrics.items():
            if isinstance(value, float):
                lines.append(f"- {key}: {value:.2f}")
            else:
                lines.append(f"- {key}: {value}")
        return "\n".join(lines)

    def _format_flags(self, flags: list) -> str:
        """Format flags for prompts."""
        lines = []
        for flag in flags[:5]:
            lines.append(
                f"- {flag.get('severity', 'medium').upper()}: "
                f"{flag.get('metric', 'unknown')} — {flag.get('explanation', '')}"
            )
        return "\n".join(lines)
