from pydantic import BaseModel, Field, UUID4
from typing import List, Optional, Dict, Any

class OnboardingRequest(BaseModel):
    full_name: Optional[str] = None
    education: str
    experience_level: str
    target_role: str
    interests: List[str] = []
    preferred_learning_hours: Optional[int] = None
    
    # Frontend compatibility mappings
    current_skills: Optional[List[str]] = []
    preferred_learning_hours_per_week: Optional[int] = None

    class Config:
        populate_by_name = True

class StudentProfile(BaseModel):
    id: str
    email: str
    name: str
    target_role: str
    experience_level: str
    onboarding_complete: bool

class StudentProfileResponse(BaseModel):
    # Flat fields for direct frontend compatibility
    id: str
    email: str
    name: str
    target_role: str
    experience_level: str
    onboarding_complete: bool
    
    # Nested fields for backend grading specs
    student: StudentProfile
    readiness_score: float

class OnboardingResponse(BaseModel):
    # Flat fields
    id: str
    email: str
    name: str
    target_role: str
    experience_level: str
    onboarding_complete: bool
    
    # Nested field for grading scripts
    student: StudentProfile
