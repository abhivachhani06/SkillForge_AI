from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class RecommendationSchema(BaseModel):
    type: Literal["course", "certification", "project", "interview_resource"]
    title: str
    description: str
    skills_practiced: Optional[List[str]] = Field(default_factory=list)
    difficulty: Literal["beginner", "intermediate", "advanced"]
    estimated_duration: str
    expected_outcome: str
    reason: str

class RecommendationListResponse(BaseModel):
    recommendations: List[RecommendationSchema]
