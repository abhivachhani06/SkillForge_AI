from pydantic import BaseModel, UUID4
from datetime import datetime

class ResumeBase(BaseModel):
    file_name: str
    raw_text: str

class ResumeCreate(ResumeBase):
    student_id: UUID4

class ResumeResponse(ResumeBase):
    id: UUID4
    student_id: UUID4
    uploaded_at: datetime

    class Config:
        from_attributes = True
