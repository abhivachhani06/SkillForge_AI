from pydantic import BaseModel, Field
from typing import List, Literal

class EducationItem(BaseModel):
    degree: str
    institution: str
    year: str

class ExperienceItem(BaseModel):
    role: str
    company: str
    duration: str
    description: str

class ProjectItem(BaseModel):
    title: str
    description: str
    tech_used: List[str] = Field(default_factory=list)

class CareerProfileSchema(BaseModel):
    skills: List[str] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    summary: str

class SkillGapItem(BaseModel):
    skill: str
    severity: Literal["low", "medium", "high"]
    why_it_matters: str
    readiness_component_score: float

class SkillGapAnalysisSchema(BaseModel):
    strengths: List[str] = Field(default_factory=list)
    gaps: List[SkillGapItem] = Field(default_factory=list)
