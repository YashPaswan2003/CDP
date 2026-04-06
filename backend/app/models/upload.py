from pydantic import BaseModel
from typing import Optional

class UploadResponse(BaseModel):
    filename: str
    rows_imported: int
    platform: str
    client_id: str
    campaign_ids: list[str]
    status: str

class UploadError(BaseModel):
    error: str
    row_number: Optional[int] = None
    message: str
