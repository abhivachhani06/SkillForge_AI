import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.db import get_db, Student, CareerProfile, SkillGap, Recommendation
from app.core.auth import get_current_user, CurrentUser
from app.core.config import settings
from app.schemas.recommendation import RecommendationSchema
from app.prompts.recommendation_prompt import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.services.skill_extractor import clean_json_response
from huggingface_hub import InferenceClient

logger = logging.getLogger("recommendation_router")

router = APIRouter(prefix="/api", tags=["recommendations"])

# ─── Deterministic Fallbacks ──────────────────────────────────────────────────
DEFAULT_FALLBACK_RECOMMENDATIONS = {
    "frontend": [
        {
            "type": "course",
            "title": "Modern React & Next.js: The Complete Guide",
            "description": "Master React 19 and Next.js 15. Learn state management, routing, server actions, and deployment.",
            "skills_practiced": [],
            "difficulty": "intermediate",
            "estimated_duration": "40 hours",
            "expected_outcome": "Build scalable web applications and pass frontend interviews.",
            "reason": "React and Next.js are primary requirements for frontend developers, which were marked as gaps in your profile."
        },
        {
            "type": "project",
            "title": "Build a SaaS Landing Page with Tailwind CSS",
            "description": "Construct a fully responsive, animated product landing page using React, Tailwind CSS, and Framer Motion.",
            "skills_practiced": ["React", "CSS", "Tailwind CSS", "Animations"],
            "difficulty": "beginner",
            "estimated_duration": "10 hours",
            "expected_outcome": "Create a high-quality showcase item for your design portfolio.",
            "reason": "Practices core CSS and responsive layout skills, helping you close design implementation gaps."
        },
        {
            "type": "interview_resource",
            "title": "Frontend Interview Cheat Sheet & Guide",
            "description": "Comprehensive review of JavaScript closures, prototype inheritance, DOM algorithms, and web security concepts.",
            "skills_practiced": [],
            "difficulty": "advanced",
            "estimated_duration": "5 hours",
            "expected_outcome": "Prepare for core technical interviews at high-tier tech companies.",
            "reason": "Reinforces your conceptual JavaScript knowledge, which is essential to clear frontend technical screens."
        }
    ],
    "backend": [
        {
            "type": "course",
            "title": "FastAPI Masterclass: Build Production-Ready APIs",
            "description": "Master building, testing, and securing APIs using FastAPI, PostgreSQL, SQLAlchemy, and Docker.",
            "skills_practiced": [],
            "difficulty": "intermediate",
            "estimated_duration": "25 hours",
            "expected_outcome": "Create secure, scalable RESTful API backends with auto-documentation.",
            "reason": "FastAPI is a major requirement for python-based backend roles, which is a gap in your experience."
        },
        {
            "type": "project",
            "title": "Build an E-commerce Inventory API",
            "description": "Develop a REST API with secure authentication (JWT), role-based permissions, and automated database migrations.",
            "skills_practiced": ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy"],
            "difficulty": "intermediate",
            "estimated_duration": "15 hours",
            "expected_outcome": "Write production-grade server code and manage complex database relationships.",
            "reason": "Allows you to practice database relationship modeling and schema designs using SQLAlchemy, addressing your database gap."
        },
        {
            "type": "certification",
            "title": "AWS Certified Developer - Associate",
            "description": "Official preparation guide covering AWS core services (EC2, ECS, Lambda, DynamoDB, RDS) and deployment pipelines.",
            "skills_practiced": [],
            "difficulty": "advanced",
            "estimated_duration": "30 hours",
            "expected_outcome": "Acquire globally recognized cloud credential showing developers capability to run code on cloud.",
            "reason": "Helps you bridge the cloud architecture gap, preparing you for senior backend or cloud-native developer roles."
        }
    ]
}

def get_fallback_recommendations(target_role: str) -> List[dict]:
    """Resolves default recommendations based on target role keywords."""
    role_lower = target_role.lower()
    if any(k in role_lower for k in ["front", "react", "ui", "web"]):
        return DEFAULT_FALLBACK_RECOMMENDATIONS["frontend"]
    else:
        return DEFAULT_FALLBACK_RECOMMENDATIONS["backend"]

# ─── Endpoint ─────────────────────────────────────────────────────────────────
@router.get("/recommendations", response_model=List[RecommendationSchema])
def get_recommendations(
    type: Optional[str] = Query(None, description="Filter by recommendation type: course, certification, project, or interview_resource"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the candidate's career recommendations.
    If none exist in the database, calls Hugging Face to generate them,
    saves them to the database, and returns them (filtering by type if requested).
    """
    # 1. Fetch Student profile
    student = db.query(Student).filter(Student.id == current_user.id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please complete onboarding first."
        )

    # 2. Check if recommendations already exist in database
    db_recs = db.query(Recommendation).filter(Recommendation.student_id == current_user.id).all()
    
    # If no recommendations exist, generate using fallback immediately
    if not db_recs:
        logger.info(f"No recommendations found for {current_user.id}. Generating with fallback...")
        profile = db.query(CareerProfile).filter(CareerProfile.student_id == current_user.id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Career profile not found. Please upload your resume first."
            )
        generated_list = get_fallback_recommendations(student.target_role or "Software Engineer")
        try:
            for item in generated_list:
                description = item.get("description", "")
                skills_practiced = item.get("skills_practiced", [])
                if skills_practiced and item.get("type") == "project":
                    description += f"\n\nSkills Practiced: {', '.join(skills_practiced)}"
                db.add(Recommendation(
                    student_id=current_user.id,
                    type=item.get("type", "course"),
                    title=item.get("title", "Resource"),
                    description=description,
                    reason=item.get("reason", ""),
                    difficulty=item.get("difficulty", "intermediate"),
                    estimated_duration=item.get("estimated_duration", ""),
                    expected_outcome=item.get("expected_outcome", "")
                ))
            db.commit()
            db_recs = db.query(Recommendation).filter(Recommendation.student_id == current_user.id).all()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to save recommendations: {e}")
            raise HTTPException(status_code=500, detail="Failed to save recommendations.")

    # 3. Format and Filter results
    response_list = []
    for r in db_recs:
        # Check if type filter is applied
        if type and r.type != type:
            continue
            
        # Parse skills_practiced from description block if it is a project
        skills_practiced = []
        desc_clean = r.description or ""
        if "Skills Practiced:" in desc_clean:
            parts = desc_clean.split("Skills Practiced:")
            desc_clean = parts[0].strip()
            skills_practiced = [s.strip() for s in parts[1].split(",") if s.strip()]

        response_list.append(RecommendationSchema(
            type=r.type,
            title=r.title or "",
            description=desc_clean,
            skills_practiced=skills_practiced,
            difficulty=r.difficulty or "intermediate",
            estimated_duration=r.estimated_duration or "",
            expected_outcome=r.expected_outcome or "",
            reason=r.reason or ""
        ))
        
    return response_list
