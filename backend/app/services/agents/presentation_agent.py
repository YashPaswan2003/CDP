"""Presentation content generation agent."""

from app.services.agents.base_agent import BaseAgent
from app.database.connection import get_connection
import logging
import json

logger = logging.getLogger("api")


class PresentationAgent(BaseAgent):
    """Agent specialized in generating slide content for presentations."""

    def __init__(self, account_id: str, client_name: str = "Client"):
        super().__init__(account_id)
        self.client_name = client_name
        self.system_prompt = self._build_presentation_prompt()

    def _build_presentation_prompt(self) -> str:
        return f"""You are a marketing presentation specialist for {self.client_name} (account: {self.account_id}).
You generate professional, executive-ready slide content.

Guidelines:
- Be concise: slides need bullet points, not paragraphs
- Use data-driven insights with specific numbers
- Structure content for visual presentation (3-5 bullets per slide)
- Include actionable recommendations with expected impact
- Reference specific campaigns, metrics, and trends
- Use professional tone suitable for client presentations

When asked to generate content for a slide, return it as a JSON object with:
- "title": slide title
- "bullets": array of bullet point strings
- "metrics": optional array of {{label, value, change}} objects
- "notes": optional presenter notes string

Always return valid JSON."""

    def generate_slide_content(self, slide_type: str, context: dict) -> dict:
        """Generate content for a specific slide type.

        Args:
            slide_type: Type of slide (executive_summary, campaign_performance, etc.)
            context: Dict with metrics, campaigns, date range etc.

        Returns:
            Dict with slide content (title, bullets, metrics, notes)
        """
        context_str = json.dumps(context, indent=2, default=str)

        prompts = {
            "executive_summary": f"""Generate an executive summary slide for {self.client_name}.
Data: {context_str}
Return JSON with title, bullets (3-5 key takeaways), and metrics (top 3 KPIs with values and % change).""",

            "platform_overview": f"""Generate a platform overview slide comparing Google, DV360, and Meta performance.
Data: {context_str}
Return JSON with title, bullets (key insight per platform), and metrics (spend, ROAS, conversions per platform).""",

            "campaign_performance": f"""Generate a campaign performance slide highlighting top and bottom performers.
Data: {context_str}
Return JSON with title, bullets (top 3 campaigns and why they worked), and metrics (key campaign stats).""",

            "keyword_analysis": f"""Generate a keyword analysis slide with top performers and opportunities.
Data: {context_str}
Return JSON with title, bullets (top keywords, declining keywords, opportunities), and metrics.""",

            "funnel_analysis": f"""Generate a funnel analysis slide showing TOFU > MOFU > BOFU performance.
Data: {context_str}
Return JSON with title, bullets (conversion rates between stages, drop-off points), and metrics.""",

            "recommendations": f"""Generate a recommendations slide with actionable next steps.
Data: {context_str}
Return JSON with title, bullets (5 specific actions ranked by impact), and notes (implementation timeline).""",

            "custom": f"""Generate slide content based on the following context.
Data: {context_str}
Return JSON with title, bullets, and optional metrics.""",
        }

        prompt = prompts.get(slide_type, prompts["custom"])

        try:
            response_text = self.get_response(prompt)
            # Try to parse JSON from response
            try:
                # Strip markdown code fences if present
                cleaned = response_text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    cleaned = cleaned.strip()
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:].strip()
                return json.loads(cleaned)
            except json.JSONDecodeError:
                return {
                    "title": slide_type.replace("_", " ").title(),
                    "bullets": [response_text],
                    "notes": "AI-generated content (raw text)",
                }
        except Exception as e:
            logger.error(f"Error generating slide content: {e}")
            return {
                "title": slide_type.replace("_", " ").title(),
                "bullets": [f"Content generation unavailable: {str(e)}"],
            }

    def chat_about_slide(self, slide_type: str, slide_data: dict, user_message: str) -> dict:
        """Chat about a specific slide and suggest content updates.

        Args:
            slide_type: Type of slide
            slide_data: Current slide data
            user_message: User's question or request

        Returns:
            Dict with response text and optional suggested_content
        """
        context = json.dumps(slide_data, indent=2, default=str)

        prompt = f"""The user is editing a '{slide_type}' slide with this content:
{context}

User request: {user_message}

If the user wants to change the slide content, return JSON with:
{{"response": "your explanation", "suggested_content": {{"title": "...", "bullets": [...], "metrics": [...]}}}}

If the user is asking a question, return JSON with:
{{"response": "your answer"}}

Always return valid JSON."""

        try:
            response_text = self.get_response(prompt)
            try:
                cleaned = response_text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    cleaned = cleaned.strip()
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:].strip()
                return json.loads(cleaned)
            except json.JSONDecodeError:
                return {"response": response_text}
        except Exception as e:
            logger.error(f"Error in slide chat: {e}")
            return {"response": f"I encountered an error: {str(e)}"}
