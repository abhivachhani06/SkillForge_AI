import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.db import get_db, RoadmapTask, ReadinessScore
from app.core.auth import get_current_user, CurrentUser
from app.schemas.roadmap import RoadmapTaskStatusUpdate, RoadmapTaskResponse
from app.routers.students import calculate_and_update_readiness

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

def get_task_dict(task: RoadmapTask) -> dict:
    """Helper to convert ORM model to dictionary format for nesting."""
    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "estimated_hours": float(task.estimated_hours) if task.estimated_hours is not None else 0.0,
        "prerequisites": task.prerequisites or [],
        "status": task.status,
        "week_number": task.week_number or 1,
    }

@router.get("", response_model=List[RoadmapTaskResponse])
def get_roadmap(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the roadmap tasks for the current user, ordered by week_number and priority (high, medium, low).
    Returns flat list for frontend compatibility.
    """
    tasks = db.query(RoadmapTask).filter(RoadmapTask.student_id == current_user.id).all()
    
    # Define priority sorting mapping
    priority_order = {"high": 0, "medium": 1, "low": 2}
    
    # Sort by week_number first (nulls last/first check), then by priority
    sorted_tasks = sorted(
        tasks,
        key=lambda t: (
            t.week_number if t.week_number is not None else 9999,
            priority_order.get((t.priority or "").lower(), 99)
        )
    )

    response_list = []
    
    # Compute current progress value for nested references
    # (If tasks are returned, we calculate progress)
    done_count = sum(1 for t in tasks if t.status == "done")
    progress_pct = (done_count / len(tasks)) * 100.0 if tasks else 0.0

    for task in sorted_tasks:
        task_dict = get_task_dict(task)
        response_list.append(
            RoadmapTaskResponse(
                id=task_dict["id"],
                title=task_dict["title"],
                description=task_dict["description"],
                priority=task_dict["priority"],
                estimated_hours=task_dict["estimated_hours"],
                prerequisites=task_dict["prerequisites"],
                status=task_dict["status"],
                week_number=task_dict["week_number"],
                task=task_dict,
                updated_progress=progress_pct
            )
        )

    return response_list


@router.patch("/{task_id}", response_model=RoadmapTaskResponse)
def update_task_status(
    task_id: uuid.UUID,
    payload: RoadmapTaskStatusUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates a task's status for the current user, recalculates readiness score & progress,
    and returns a hybrid response with task fields + nested task & updated_progress.
    """
    # 1. Fetch task
    task = db.query(RoadmapTask).filter(RoadmapTask.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    # 2. Check ownership (Cross-user access denied)
    if task.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or access denied"
        )

    # 3. Update status
    new_status = payload.status.lower()
    if new_status not in ["pending", "in_progress", "done"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Status must be one of 'pending', 'in_progress', or 'done'"
        )
    task.status = new_status
    db.commit()
    db.refresh(task)

    # 4. Recalculate progress & readiness score
    db_score = calculate_and_update_readiness(db, current_user.id)
    
    # Calculate roadmap progress percentage
    all_tasks = db.query(RoadmapTask).filter(RoadmapTask.student_id == current_user.id).all()
    done_count = sum(1 for t in all_tasks if t.status == "done")
    progress_pct = (done_count / len(all_tasks)) * 100.0 if all_tasks else 0.0

    # 5. Build dual-compatible response
    task_dict = get_task_dict(task)
    
    return RoadmapTaskResponse(
        id=task_dict["id"],
        title=task_dict["title"],
        description=task_dict["description"],
        priority=task_dict["priority"],
        estimated_hours=task_dict["estimated_hours"],
        prerequisites=task_dict["prerequisites"],
        status=task_dict["status"],
        week_number=task_dict["week_number"],
        task=task_dict,
        updated_progress=progress_pct
    )
