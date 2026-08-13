import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.db import get_db, Student, CareerProfile, ReadinessScore, SkillGap, RoadmapTask
from app.core.auth import get_current_user, CurrentUser
from app.schemas.student import OnboardingRequest, StudentProfileResponse, OnboardingResponse, StudentProfile

router = APIRouter(prefix="/api/students", tags=["students"])

# ─── Shared Score Calculator ──────────────────────────────────────────────────
def calculate_and_update_readiness(db: Session, student_id: uuid.UUID) -> ReadinessScore:
    """
    Recalculates the student's career readiness score and skill breakdown,
    saving the result to the readiness_scores table.
    Formula: score = round(100 - avg(gaps.score) * 0.6 + progress_pct * 0.4)
    Clamped to [0, 100].
    """
    # 1. Fetch skill gaps
    gaps = db.query(SkillGap).filter(SkillGap.student_id == student_id).all()
    if gaps:
        avg_gap_score = sum(float(g.readiness_component_score) for g in gaps) / len(gaps)
    else:
        avg_gap_score = 0.0

    # 2. Fetch roadmap tasks and calculate progress percentage
    tasks = db.query(RoadmapTask).filter(RoadmapTask.student_id == student_id).all()
    if tasks:
        done_tasks = sum(1 for t in tasks if t.status == "done")
        roadmap_progress_pct = (done_tasks / len(tasks)) * 100.0
    else:
        roadmap_progress_pct = 0.0

    # 3. Apply formula
    score = round(100.0 - avg_gap_score * 0.6 + roadmap_progress_pct * 0.4)
    score = max(0.0, min(100.0, score))

    # 4. Compute categories breakdown
    system_design_score = 100
    cloud_devops_scores = []
    other_gaps_scores = []

    for gap in gaps:
        skill_lower = gap.skill.lower() if gap.skill else ""
        if "system design" in skill_lower:
            system_design_score = float(gap.readiness_component_score or 0)
        elif any(k in skill_lower for k in ["aws", "docker", "kubernetes", "cloud", "devops"]):
            cloud_devops_scores.append(float(gap.readiness_component_score or 0))
        else:
            other_gaps_scores.append(float(gap.readiness_component_score or 0))

    if cloud_devops_scores:
        cloud_devops_score = sum(cloud_devops_scores) / len(cloud_devops_scores)
    else:
        cloud_devops_score = 100.0

    if other_gaps_scores:
        tech_skills_score = sum(other_gaps_scores) / len(other_gaps_scores)
    else:
        tech_skills_score = 100.0

    interview_readiness_score = min(100.0, 40.0 + roadmap_progress_pct * 0.6)

    # Fetch career profile to count projects
    career_profile = db.query(CareerProfile).filter(CareerProfile.student_id == student_id).first()
    projects_score = 50.0
    if career_profile and career_profile.projects:
        if isinstance(career_profile.projects, list):
            projects_score = min(100.0, len(career_profile.projects) * 25.0 + 25.0)

    breakdown = {
        "Technical Skills": round(tech_skills_score),
        "System Design": round(system_design_score),
        "Cloud/DevOps": round(cloud_devops_score),
        "Projects Portfolio": round(projects_score),
        "Interview Readiness": round(interview_readiness_score),
    }

    # 5. Upsert readiness_scores
    db_score = db.query(ReadinessScore).filter(ReadinessScore.student_id == student_id).first()
    if not db_score:
        db_score = ReadinessScore(
            student_id=student_id,
            score=score,
            breakdown=breakdown
        )
        db.add(db_score)
    else:
        db_score.score = score
        db_score.breakdown = breakdown
        db_score.updated_at = func.now()

    db.commit()
    db.refresh(db_score)
    return db_score


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/onboarding", response_model=OnboardingResponse, status_code=status.HTTP_200_OK)
def onboarding(
    payload: OnboardingRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Onboarding submission endpoint. Upserts student row and initializes career profile.
    """
    # 1. Resolve values (supporting both frontend & backend prompt fields)
    name = payload.full_name or current_user.full_name or current_user.email.split("@")[0]
    
    learning_hours = 10
    if payload.preferred_learning_hours is not None:
        learning_hours = payload.preferred_learning_hours
    elif payload.preferred_learning_hours_per_week is not None:
        learning_hours = payload.preferred_learning_hours_per_week

    # 2. Check and upsert Student
    db_student = db.query(Student).filter(Student.id == current_user.id).first()
    if not db_student:
        db_student = Student(
            id=current_user.id,
            full_name=name,
            education=payload.education,
            experience_level=payload.experience_level,
            target_role=payload.target_role,
            interests=payload.interests,
            preferred_learning_hours=learning_hours
        )
        db.add(db_student)
    else:
        db_student.full_name = name
        db_student.education = payload.education
        db_student.experience_level = payload.experience_level
        db_student.target_role = payload.target_role
        db_student.interests = payload.interests
        db_student.preferred_learning_hours = learning_hours
    
    # Flush session so that the student record exists before inserting career_profiles
    db.flush()
    
    # 3. Initialize/update Career Profile if skills are passed during onboarding
    if payload.current_skills:
        db_profile = db.query(CareerProfile).filter(CareerProfile.student_id == current_user.id).first()
        if not db_profile:
            db_profile = CareerProfile(
                student_id=current_user.id,
                skills=payload.current_skills,
                education=[],
                experience=[],
                projects=[],
                summary=""
            )
            db.add(db_profile)
        else:
            db_profile.skills = payload.current_skills

    db.commit()
    db.refresh(db_student)

    # 4. Recalculate default score
    calculate_and_update_readiness(db, current_user.id)

    # 5. Build dual-compatible response
    profile_data = StudentProfile(
        id=str(db_student.id),
        email=current_user.email,
        name=db_student.full_name or name,
        target_role=db_student.target_role or "",
        experience_level=db_student.experience_level or "beginner",
        onboarding_complete=True
    )

    return OnboardingResponse(
        id=profile_data.id,
        email=profile_data.email,
        name=profile_data.name,
        target_role=profile_data.target_role,
        experience_level=profile_data.experience_level,
        onboarding_complete=profile_data.onboarding_complete,
        student=profile_data
    )


@router.get("/me", response_model=StudentProfileResponse)
def get_me(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the student's own profile and readiness score.
    """
    db_student = db.query(Student).filter(Student.id == current_user.id).first()
    
    # If student row doesn't exist, return onboarding_complete = False rather than failing
    if not db_student:
        profile_data = StudentProfile(
            id=str(current_user.id),
            email=current_user.email,
            name=current_user.full_name or current_user.email.split("@")[0],
            target_role="",
            experience_level="beginner",
            onboarding_complete=False
        )
        return StudentProfileResponse(
            id=profile_data.id,
            email=profile_data.email,
            name=profile_data.name,
            target_role=profile_data.target_role,
            experience_level=profile_data.experience_level,
            onboarding_complete=profile_data.onboarding_complete,
            student=profile_data,
            readiness_score=0.0
        )

    # Recalculate score to make sure it's up to date
    db_score = calculate_and_update_readiness(db, current_user.id)
    score_val = float(db_score.score) if db_score else 0.0

    profile_data = StudentProfile(
        id=str(db_student.id),
        email=current_user.email,
        name=db_student.full_name or "User",
        target_role=db_student.target_role or "",
        experience_level=db_student.experience_level or "beginner",
        onboarding_complete=True
    )

    return StudentProfileResponse(
        id=profile_data.id,
        email=profile_data.email,
        name=profile_data.name,
        target_role=profile_data.target_role,
        experience_level=profile_data.experience_level,
        onboarding_complete=profile_data.onboarding_complete,
        student=profile_data,
        readiness_score=score_val
    )
