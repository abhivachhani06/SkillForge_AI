import json
import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional

from app.core.db import get_db, Student, CareerProfile, SkillGap, RoadmapTask
from app.core.auth import get_current_user, CurrentUser
from app.core.config import settings
from app.prompts.roadmap_prompt import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.services.skill_extractor import clean_json_response
from app.routers.students import calculate_and_update_readiness
from huggingface_hub import InferenceClient

logger = logging.getLogger("roadmap_ai_router")

router = APIRouter(prefix="/api", tags=["roadmap-ai"])

# ─── Request Body Schema ──────────────────────────────────────────────────────
class RoadmapGenerateRequest(BaseModel):
    target_role: Optional[str] = None

# ─── Deterministic Fallbacks ──────────────────────────────────────────────────
DEFAULT_FALLBACK_ROADMAPS = {
    "frontend": [
        {"title": "HTML5, CSS3, and Responsive Design", "description": "Master layout structures using flexbox, CSS grid, and modern custom properties.", "priority": "high", "estimated_hours": 10.0, "prerequisites": [], "week_number": 1},
        {"title": "JavaScript Fundamentals & ES6+", "description": "Understand lexical scope, closures, promises, async/await, and DOM APIs.", "priority": "high", "estimated_hours": 15.0, "prerequisites": ["HTML5, CSS3, and Responsive Design"], "week_number": 2},
        {"title": "React Basics & Functional Hooks", "description": "Learn functional components, state management, props, and standard React hooks.", "priority": "high", "estimated_hours": 20.0, "prerequisites": ["JavaScript Fundamentals & ES6+"], "week_number": 3},
        {"title": "Next.js Core Concepts", "description": "Study SSR, SSG, nested page layouts, and client vs server components.", "priority": "medium", "estimated_hours": 15.0, "prerequisites": ["React Basics & Functional Hooks"], "week_number": 4}
    ],
    "backend": [
        {"title": "Python Language & Advanced OOP", "description": "Master data structures, object-oriented concepts, exception handling, and decorators.", "priority": "high", "estimated_hours": 12.0, "prerequisites": [], "week_number": 1},
        {"title": "SQL Databases & SQLAlchemy ORM", "description": "Design database schemas, write raw SQL queries, and implement relational mapping in Python.", "priority": "high", "estimated_hours": 18.0, "prerequisites": ["Python Language & Advanced OOP"], "week_number": 2},
        {"title": "FastAPI Web Framework APIs", "description": "Learn routing, pydantic input validation, dependency injection, and security configurations.", "priority": "high", "estimated_hours": 20.0, "prerequisites": ["SQL Databases & SQLAlchemy ORM"], "week_number": 3},
        {"title": "Docker Containerization & Testing", "description": "Dockerize the FastAPI service, write unit tests with pytest, and set up simple JWT auth.", "priority": "medium", "estimated_hours": 15.0, "prerequisites": ["FastAPI Web Framework APIs"], "week_number": 4}
    ],
    "devops": [
        {"title": "Linux Administration & Shell Scripting", "description": "Learn file management, command-line utilities, user permissions, and basic bash automation.", "priority": "high", "estimated_hours": 15.0, "prerequisites": [], "week_number": 1},
        {"title": "Docker Containerization", "description": "Understand images, layers, networks, volumes, and multi-container setups using Docker Compose.", "priority": "high", "estimated_hours": 18.0, "prerequisites": ["Linux Administration & Shell Scripting"], "week_number": 2},
        {"title": "CI/CD & DevOps Automation (GitHub Actions)", "description": "Build pipelines to automate building, testing, linting, and basic server deployments.", "priority": "high", "estimated_hours": 20.0, "prerequisites": ["Docker Containerization"], "week_number": 3},
        {"title": "AWS Infrastructure Essentials", "description": "Configure compute instances (EC2), secure networks (VPC), bucket storage (S3), and access roles (IAM).", "priority": "medium", "estimated_hours": 20.0, "prerequisites": ["CI/CD & DevOps Automation (GitHub Actions)"], "week_number": 4}
    ]
}

def get_fallback_roadmap(target_role: str) -> List[dict]:
    """Resolves a default, clean roadmap list based on target role keywords."""
    role_lower = target_role.lower()
    if any(k in role_lower for k in ["front", "react", "ui", "web"]):
        return DEFAULT_FALLBACK_ROADMAPS["frontend"]
    elif any(k in role_lower for k in ["back", "python", "api", "node", "data engineer"]):
        return DEFAULT_FALLBACK_ROADMAPS["backend"]
    elif any(k in role_lower for k in ["devops", "cloud", "sre", "platform"]):
        return DEFAULT_FALLBACK_ROADMAPS["devops"]
    else:
        # Default combination
        return DEFAULT_FALLBACK_ROADMAPS["backend"]

# ─── Endpoint ─────────────────────────────────────────────────────────────────
@router.post("/roadmap/generate")
def generate_roadmap(
    payload: RoadmapGenerateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a multi-week structured learning roadmap based on skill gaps.
    Saves new tasks to the database (preserving completed ones) and updates the readiness score.
    Returns the updated flat list of roadmap tasks.
    """
    # 1. Fetch Student profile
    student = db.query(Student).filter(Student.id == current_user.id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please complete onboarding first."
        )

    # Update student's target role if explicitly provided in request body
    if payload.target_role:
        student.target_role = payload.target_role
        db.flush()

    # 2. Fetch Career Profile (required for skills data)
    profile = db.query(CareerProfile).filter(CareerProfile.student_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career profile not found. Please upload your resume first."
        )

    # 3. Fetch Skill Gaps
    gaps = db.query(SkillGap).filter(SkillGap.student_id == current_user.id).all()
    gaps_str = ", ".join([f"{g.skill} ({g.severity} severity)" for g in gaps]) if gaps else "None"

    # 4. Fetch Completed Tasks (to avoid duplicate generation)
    existing_tasks = db.query(RoadmapTask).filter(RoadmapTask.student_id == current_user.id).all()
    completed_task_titles = [t.title for t in existing_tasks if t.status == "done"]

    # 5. Call Hugging Face API for AI generation
    generated_tasks = []
    
    if settings.HUGGINGFACE_API_KEY:
        try:
            client = InferenceClient(
                model="Qwen/Qwen2.5-Coder-7B-Instruct",
                token=settings.HUGGINGFACE_API_KEY,
                timeout=30.0
            )
            
            user_prompt = USER_PROMPT_TEMPLATE.format(
                target_role=student.target_role or "Software Engineer",
                experience_level=student.experience_level or "beginner",
                skills=", ".join(profile.skills or []),
                gaps=gaps_str,
                completed_tasks=", ".join(completed_task_titles) if completed_task_titles else "None"
            )
            
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
            
            # Send prompt to model
            response = client.chat.completions.create(
                messages=messages,
                max_tokens=2048,
                temperature=0.2
            )
            
            response_text = response.choices[0].message.content
            cleaned_response = clean_json_response(response_text)
            
            data = json.loads(cleaned_response)
            generated_tasks = data.get("tasks", [])
            
        except Exception as e:
            logger.error(f"Failed to generate roadmap with HF: {e}. Using fallback.")
            generated_tasks = get_fallback_roadmap(student.target_role)
    else:
        logger.warning("HUGGINGFACE_API_KEY not configured. Using fallback.")
        generated_tasks = get_fallback_roadmap(student.target_role)

    # 6. Database Transaction: Remove old tasks that are NOT completed, insert new tasks
    try:
        # Delete only pending/in-progress tasks (Preserve 'done' tasks!)
        db.query(RoadmapTask).filter(
            RoadmapTask.student_id == current_user.id,
            RoadmapTask.status != "done"
        ).delete()
        
        # Insert newly generated tasks
        for task in generated_tasks:
            # Check if this task is already in the completed list to prevent duplicate insertion
            if task.get("title") in completed_task_titles:
                continue
                
            db_task = RoadmapTask(
                student_id=current_user.id,
                title=task.get("title", "Learn Skill"),
                description=task.get("description", ""),
                priority=task.get("priority", "medium"),
                estimated_hours=task.get("estimated_hours", 10.0),
                prerequisites=task.get("prerequisites", []),
                status="pending",
                week_number=task.get("week_number", 1)
            )
            db.add(db_task)
            
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save generated roadmap tasks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save generated roadmap tasks to database."
        )

    # 7. Recalculate readiness score and return flat list of all tasks
    calculate_and_update_readiness(db, current_user.id)
    
    all_updated_tasks = db.query(RoadmapTask).filter(RoadmapTask.student_id == current_user.id).all()
    
    # Format responses to return as a flat list directly (matches frontend apiFetch signature)
    response_list = []
    for t in all_updated_tasks:
        response_list.append({
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "estimated_hours": float(t.estimated_hours) if t.estimated_hours is not None else 0.0,
            "prerequisites": t.prerequisites or [],
            "status": t.status,
            "week_number": t.week_number or 1
        })
        
    return response_list
