import json
import logging
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

from app.core.db import get_db, Student, CareerProfile, SkillGap, MentorMessage, ReadinessScore
from app.core.auth import get_current_user, CurrentUser
from app.core.config import settings
from app.prompts.mentor_prompt import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.services.skill_extractor import clean_json_response
from huggingface_hub import InferenceClient

logger = logging.getLogger("mentor_router")

router = APIRouter(prefix="/api", tags=["mentor"])

# ─── Simple Rate Limiter ──────────────────────────────────────────────────────
# Tracks timestamps of recent requests per student ID (limit 15 requests per 60s)
user_chat_history_timestamps = defaultdict(list)

def is_rate_limited(user_id: str, limit: int = 15, period: int = 60) -> bool:
    now = time.time()
    # Filter for timestamps in the last 60 seconds
    timestamps = [t for t in user_chat_history_timestamps[user_id] if now - t < period]
    user_chat_history_timestamps[user_id] = timestamps
    
    if len(timestamps) >= limit:
        return True
    
    user_chat_history_timestamps[user_id].append(now)
    return False

# ─── Request/Response Schemas ──────────────────────────────────────────────────
class MessageItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: Optional[str] = None

class MentorChatRequest(BaseModel):
    message: str
    history: Optional[List[MessageItem]] = []

class SuggestedAction(BaseModel):
    type: Literal["roadmap_task", "project", "none"]
    reference_id: Optional[str] = None

class MentorMessageResponse(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    reply: str
    suggested_action: SuggestedAction
    timestamp: str

# ─── Deterministic Fallbacks ──────────────────────────────────────────────────
def get_fallback_mentor_reply(
    message: str,
    target_role: str,
    skills: List[str],
    gaps: str,
    progress_pct: float,
    readiness_score: int
) -> dict:
    """Provides conversational, role-aware fallback answers if the LLM times out."""
    msg_lower = message.lower()
    
    if any(k in msg_lower for k in ["ready", "score", "percent", "readiness"]):
        reply = (
            f"Your Career Readiness score is currently {readiness_score}/100, which places you in a solid starting position. "
            f"Your current roadmap progress is {progress_pct}%. To increase this score significantly, I recommend focusing on "
            f"closing your primary skill gaps ({gaps}) and completing the pending tasks in your learning roadmap."
        )
        action_type = "roadmap_task"
    elif any(k in msg_lower for k in ["project", "portfolio", "build"]):
        reply = (
            f"For a {target_role} role, building hands-on projects is the best way to prove your skills! "
            f"Since you already have skills in {', '.join(skills[:3])}, you should build a project that integrates "
            f"them while attempting to learn one of your gap skills. What kind of project were you thinking of starting?"
        )
        action_type = "project"
    elif any(k in msg_lower for k in ["study", "learn", "hour", "today", "what to do"]):
        reply = (
            "If you only have a couple of hours today, I suggest choosing the highest-priority pending item on your learning roadmap. "
            "Focusing on a single topic, like practicing coding challenges or reading API documentation, will build consistent momentum."
        )
        action_type = "roadmap_task"
    else:
        reply = (
            f"That's a great question! As your AI Career Mentor for {target_role}, I am here to guide you. "
            f"I recommend continuing with your custom learning roadmap, concentrating on closing your key gaps in {gaps}. "
            f"What specific area or technology would you like to discuss or learn about next?"
        )
        action_type = "none"

    return {
        "reply": reply,
        "suggested_action": {
            "type": action_type,
            "reference_id": None
        }
    }

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/mentor/chat", response_model=MentorMessageResponse)
def mentor_chat(
    payload: MentorChatRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Handles conversation with the career mentor. Injects full profile and gap context.
    Saves user and assistant messages in database, and returns the formatted response.
    """
    # 1. Rate Limit Check
    if is_rate_limited(str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait a moment before sending another message."
        )

    # 2. Gather context
    student = db.query(Student).filter(Student.id == current_user.id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please complete onboarding first."
        )
        
    profile = db.query(CareerProfile).filter(CareerProfile.student_id == current_user.id).first()
    skills_list = profile.skills if (profile and profile.skills) else ["General Software Engineering"]
    
    gaps = db.query(SkillGap).filter(SkillGap.student_id == current_user.id).all()
    gaps_str = ", ".join([g.skill for g in gaps]) if gaps else "None"
    
    readiness = db.query(ReadinessScore).filter(ReadinessScore.student_id == current_user.id).first()
    score_val = readiness.score if readiness else 45
    breakdown_val = readiness.breakdown if readiness else {}

    # Calculate roadmap progress percentage
    from app.core.db import RoadmapTask
    total_tasks = db.query(RoadmapTask).filter(RoadmapTask.student_id == current_user.id).count()
    completed_tasks = db.query(RoadmapTask).filter(RoadmapTask.student_id == current_user.id, RoadmapTask.status == "done").count()
    progress_pct = round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0

    # 3. Format previous history for the prompt
    # Load last 5 messages from the database history for consistency
    db_history = db.query(MentorMessage).filter(
        MentorMessage.student_id == current_user.id
    ).order_by(MentorMessage.created_at.desc()).limit(5).all()
    db_history.reverse() # Sorted ascending chronologically

    history_formatted = ""
    for msg in db_history:
        history_formatted += f"{msg.role.upper()}: {msg.content}\n"
    if not history_formatted:
        history_formatted = "None (Beginning of conversation)"

    # 4. Invoke LLM via Hugging Face Client
    response_data = None
    
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
                skills=", ".join(skills_list),
                gaps=gaps_str,
                progress_pct=progress_pct,
                readiness_score=score_val,
                readiness_breakdown=json.dumps(breakdown_val),
                chat_history=history_formatted,
                student_message=payload.message
            )
            
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
            
            response = client.chat.completions.create(
                messages=messages,
                max_tokens=1024,
                temperature=0.7
            )
            
            response_text = response.choices[0].message.content
            cleaned_response = clean_json_response(response_text)
            response_data = json.loads(cleaned_response)
            
        except Exception as e:
            logger.error(f"HF mentor chat failed: {e}. Using fallback.")
            response_data = get_fallback_mentor_reply(
                payload.message, student.target_role, skills_list, gaps_str, progress_pct, score_val
            )
    else:
        logger.warning("HUGGINGFACE_API_KEY not configured. Using fallback.")
        response_data = get_fallback_mentor_reply(
            payload.message, student.target_role, skills_list, gaps_str, progress_pct, score_val
        )

    # 5. Database Transactions: Save both user message and assistant reply
    assistant_reply = response_data.get("reply", "Understood.")
    
    try:
        user_db_msg = MentorMessage(
            student_id=current_user.id,
            role="user",
            content=payload.message
        )
        assistant_db_msg = MentorMessage(
            student_id=current_user.id,
            role="assistant",
            content=assistant_reply
        )
        db.add(user_db_msg)
        db.add(assistant_db_msg)
        db.commit()
        
        # Keep track of assistant message ID
        assistant_msg_id = str(assistant_db_msg.id)
        created_timestamp = assistant_db_msg.created_at.isoformat() if assistant_db_msg.created_at else ""
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save mentor chat history: {e}")
        # Use generated uuid if DB commit failed
        assistant_msg_id = str(uuid.uuid4())
        created_timestamp = ""

    # 6. Format final output model (compatible with frontend expectations)
    return MentorMessageResponse(
        id=assistant_msg_id,
        role="assistant",
        content=assistant_reply,  # required by frontend setMessages
        reply=assistant_reply,    # required by Abhi's prompt spec
        suggested_action=SuggestedAction(
            type=response_data.get("suggested_action", {}).get("type", "none"),
            reference_id=response_data.get("suggested_action", {}).get("reference_id")
        ),
        timestamp=created_timestamp
    )


@router.get("/mentor/history", response_model=List[MessageItem])
def get_mentor_history(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches full chat history for the authenticated student.
    """
    msgs = db.query(MentorMessage).filter(
        MentorMessage.student_id == current_user.id
    ).order_by(MentorMessage.created_at.asc()).all()
    
    response_list = []
    for m in msgs:
        response_list.append(MessageItem(
            role=m.role,
            content=m.content,
            timestamp=m.created_at.isoformat() if m.created_at else None
        ))
        
    return response_list
