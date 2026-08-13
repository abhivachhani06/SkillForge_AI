import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.db import get_db, Student, Resume, CareerProfile, SkillGap
from app.core.auth import get_current_user, CurrentUser
from app.schemas.career_profile import CareerProfileSchema, SkillGapItem
from app.services.resume_parser import extract_text
from app.services.skill_extractor import extract_skills
from app.services.gap_analysis import analyze_gaps
from app.routers.students import calculate_and_update_readiness

logger = logging.getLogger("resume_router")

router = APIRouter(prefix="/api", tags=["resume"])

@router.post("/resume/upload", response_model=CareerProfileSchema, status_code=status.HTTP_200_OK)
async def upload_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form(None),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Multipart upload route for resume files (PDF or DOCX, max 5MB).
    Extracts text, parses career profile, performs skill gap analysis,
    saves all models to the database, updates the readiness score, and returns the profile.
    """
    # 1. Validate file format
    lower_filename = file.filename.lower()
    if not (lower_filename.endswith(".pdf") or lower_filename.endswith(".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF and DOCX files are allowed."
        )

    # 2. Validate file size (max 5MB = 5 * 1024 * 1024 bytes)
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit."
        )

    # 3. Extract raw text from resume
    try:
        raw_text = extract_text(file_bytes, file.filename)
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from resume: {str(e)}"
        )

    # 4. Check/Create Student record (Foreign key dependency)
    db_student = db.query(Student).filter(Student.id == current_user.id).first()
    if not db_student:
        logger.info(f"Student profile does not exist for {current_user.id}. Creating default.")
        db_student = Student(
            id=current_user.id,
            full_name=current_user.full_name or current_user.email.split("@")[0],
            education="Not Specified",
            experience_level="beginner",
            target_role=target_role or "Software Engineer",
            interests=[],
            preferred_learning_hours=10
        )
        db.add(db_student)
        db.flush()
    else:
        # If target_role is explicitly provided in the form, update the student record
        if target_role:
            db_student.target_role = target_role
            db.flush()

    # 5. Save the parsed raw text to the resumes table
    db_resume = Resume(
        student_id=current_user.id,
        file_name=file.filename,
        raw_text=raw_text
    )
    db.add(db_resume)

    # 6. Call LLM/fallback service to extract skills
    career_profile_schema = extract_skills(raw_text)

    # 7. Upsert Career Profile
    db_profile = db.query(CareerProfile).filter(CareerProfile.student_id == current_user.id).first()
    
    profile_data = {
        "skills": career_profile_schema.skills,
        "education": [e.dict() for e in career_profile_schema.education],
        "experience": [e.dict() for e in career_profile_schema.experience],
        "projects": [p.dict() for p in career_profile_schema.projects],
        "summary": career_profile_schema.summary
    }

    if not db_profile:
        db_profile = CareerProfile(
            student_id=current_user.id,
            skills=profile_data["skills"],
            education=profile_data["education"],
            experience=profile_data["experience"],
            projects=profile_data["projects"],
            summary=profile_data["summary"]
        )
        db.add(db_profile)
    else:
        db_profile.skills = profile_data["skills"]
        db_profile.education = profile_data["education"]
        db_profile.experience = profile_data["experience"]
        db_profile.projects = profile_data["projects"]
        db_profile.summary = profile_data["summary"]
        
    db.flush()

    # 8. Call LLM/fallback to perform Gap Analysis
    analysis = analyze_gaps(
        skills=career_profile_schema.skills,
        target_role=db_student.target_role or "Software Engineer",
        experience_level=db_student.experience_level or "beginner"
    )

    # 9. Delete old skill gaps for current user and save new ones
    db.query(SkillGap).filter(SkillGap.student_id == current_user.id).delete()
    for gap in analysis.gaps:
        db_gap = SkillGap(
            student_id=current_user.id,
            skill=gap.skill,
            severity=gap.severity,
            why_it_matters=gap.why_it_matters,
            readiness_component_score=gap.readiness_component_score
        )
        db.add(db_gap)

    # 10. Commit changes and trigger readiness score updates
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database transaction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save parsed resume profile to database."
        )

    # Calculate and update score (saves to database internally)
    calculate_and_update_readiness(db, current_user.id)

    return career_profile_schema


@router.get("/resume/profile", response_model=CareerProfileSchema)
def get_career_profile(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the latest extracted CareerProfile for the current user.
    """
    db_profile = db.query(CareerProfile).filter(CareerProfile.student_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career profile not found. Please upload your resume first."
        )
    return CareerProfileSchema(
        skills=db_profile.skills or [],
        education=db_profile.education or [],
        experience=db_profile.experience or [],
        projects=db_profile.projects or [],
        summary=db_profile.summary or ""
    )


@router.get("/gaps", response_model=List[SkillGapItem])
def get_skill_gaps(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the list of skill gaps identified for the current user.
    """
    gaps = db.query(SkillGap).filter(SkillGap.student_id == current_user.id).all()
    
    # Convert ORM to Pydantic list items
    response_list = []
    for g in gaps:
        response_list.append(SkillGapItem(
            skill=g.skill or "",
            severity=g.severity or "medium",
            why_it_matters=g.why_it_matters or "",
            readiness_component_score=float(g.readiness_component_score) if g.readiness_component_score is not None else 0.0
        ))
    return response_list
