from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db, RoadmapTask
from app.core.auth import get_current_user, CurrentUser
from app.routers.students import calculate_and_update_readiness

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/summary")
def get_progress_summary(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the user's progress summary:
    {readiness_score, breakdown, roadmap_progress_pct}
    """
    # 1. Trigger recalculation to ensure fresh scores and breakdown
    db_score = calculate_and_update_readiness(db, current_user.id)
    
    # 2. Calculate task completion progress percentage
    tasks = db.query(RoadmapTask).filter(RoadmapTask.student_id == current_user.id).all()
    done_tasks = sum(1 for t in tasks if t.status == "done")
    roadmap_progress_pct = (done_tasks / len(tasks)) * 100.0 if tasks else 0.0

    return {
        "readiness_score": float(db_score.score) if db_score.score is not None else 0.0,
        "breakdown": db_score.breakdown or {},
        "roadmap_progress_pct": roadmap_progress_pct
    }
