from pydantic import BaseModel
from typing import Optional, List

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    client_id: str
    messages: List[Message]
    context: Optional[dict] = None  # Additional context like date range

class ChatResponse(BaseModel):
    message: str
    tokens_used: int
    client_id: str
