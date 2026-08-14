from pydantic import BaseModel
from typing import Optional, Literal

class MentorChatRequest(BaseModel):
    message: str

class SuggestedAction(BaseModel):
    type: Literal["roadmap_task", "project", "none"]
    reference_id: Optional[str] = None

class MentorReplySchema(BaseModel):
    reply: str
    suggested_action: SuggestedAction
