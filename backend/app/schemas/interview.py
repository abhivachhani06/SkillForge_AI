from pydantic import BaseModel
from typing import List, Literal, Optional

class InterviewQuestionSchema(BaseModel):
    question: str
    type: Literal["technical", "hr"]
    difficulty: Literal["easy", "medium", "hard"]
    model_answer: str
    follow_up: Optional[str] = None

class InterviewGenerationRequest(BaseModel):
    role: str
    difficulty: Literal["easy", "medium", "hard"]

class InterviewSessionResponse(BaseModel):
    session_id: str
    role: str
    questions: List[InterviewQuestionSchema]
