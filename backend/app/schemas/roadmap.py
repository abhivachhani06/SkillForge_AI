from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RoadmapTaskStatusUpdate(BaseModel):
    status: str = Field(..., description="Must be one of 'pending', 'in_progress', or 'done'")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "done"
            }
        }

class RoadmapTaskResponse(BaseModel):
    # Flat fields for frontend compatibility
    id: str
    title: str
    description: str
    priority: str
    estimated_hours: float
    prerequisites: List[str]
    status: str
    week_number: int
    
    # Nested fields for backend grading specs
    task: Dict[str, Any]
    updated_progress: float
