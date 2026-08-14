import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

from app.core.db import get_db, CareerProfile, InterviewSession
from app.core.auth import get_current_user, CurrentUser
from app.core.config import settings
from app.schemas.interview import InterviewQuestionSchema
from app.prompts.interview_prompt import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.services.skill_extractor import clean_json_response
from huggingface_hub import InferenceClient

logger = logging.getLogger("interview_router")

router = APIRouter(prefix="/api", tags=["interview"])

# ─── Request Body Schema ──────────────────────────────────────────────────────
class InterviewGenerateRequest(BaseModel):
    target_role: str
    difficulty: Optional[Literal["easy", "medium", "hard"]] = "medium"

# ─── Deterministic Fallbacks ──────────────────────────────────────────────────
DEFAULT_FALLBACK_QUESTIONS = {
    "frontend": [
        {
            "question": "What is the difference between state and props in React, and how does the virtual DOM work?",
            "type": "technical",
            "difficulty": "medium",
            "model_answer": "State is the internal data storage of a component that can change over time, whereas props are configuration inputs passed down from parent components and are read-only. The Virtual DOM is a lightweight memory representation of the real DOM. React uses it to compute diffs (reconciliation) and update only the changed nodes in the real DOM for high performance.",
            "follow_up": "How does the 'key' prop help React's virtual DOM diffing algorithm?"
        },
        {
            "question": "Describe a time you had to improve page load speed or optimization. What was your process?",
            "type": "hr",
            "difficulty": "medium",
            "model_answer": "In my previous project, I noticed a slow load time due to large image sizes and unoptimized bundles. I implemented image lazy-loading, compressed image assets using WebP format, and analyzed our bundle size. I then enabled code-splitting in React using dynamic imports. This decreased our bundle size by 30% and improved our Lighthouse speed index score from 65 to 88.",
            "follow_up": "How do you measure web performance in a production application?"
        },
        {
            "question": "Explain the concept of closures in JavaScript and provide a common use case.",
            "type": "technical",
            "difficulty": "hard",
            "model_answer": "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). In other words, a closure gives an inner function access to the outer function's scope even after the outer function has returned. A common use case is data encapsulation or creating private variables that cannot be accessed directly from the outside.",
            "follow_up": "What is a potential memory leak risk associated with closures?"
        }
    ],
    "backend": [
        {
            "question": "Explain the difference between SQL and NoSQL databases, and when would you choose one over the other?",
            "type": "technical",
            "difficulty": "medium",
            "model_answer": "SQL databases are relational, table-based, and have strict schemas, making them ideal for complex queries and transactional systems requiring ACID compliance (like financial systems). NoSQL databases are non-relational, document/key-value based, and have dynamic schemas, which is preferred for unstructured data, real-time caching, and massive scale out (like log aggregators or chat apps).",
            "follow_up": "What is the CAP Theorem, and how does it relate to database choices?"
        },
        {
            "question": "How do you approach debugging a critical production bug under a tight timeline?",
            "type": "hr",
            "difficulty": "medium",
            "model_answer": "My first step is containment: I check if we need to roll back the latest release to restore service immediately. Once stabilized, I reproduce the issue by checking APM logs, trace IDs, and error tracking tools (like Sentry). I isolate the root cause, write a regression test to verify the fix locally, deploy it to staging for quick verification, and then release it to production with extra monitoring.",
            "follow_up": "Can you describe a specific time you had to resolve a high-stress production outage?"
        },
        {
            "question": "What is the difference between synchronous and asynchronous tasks in a web framework like FastAPI?",
            "type": "technical",
            "difficulty": "hard",
            "model_answer": "Synchronous endpoints block the single-threaded event loop during I/O operations (like database queries), meaning the server cannot process other requests concurrently. Asynchronous tasks (defined with async/await) release control back to the event loop during I/O wait periods, allowing the framework to handle thousands of concurrent requests on a single thread. This makes async ideal for high-concurrency web applications.",
            "follow_up": "When would you choose to run a task in a background worker (like Celery) instead of using async/await?"
        }
    ]
}

def get_fallback_questions(target_role: str) -> List[dict]:
    """Resolves default interview questions based on target role keywords."""
    role_lower = target_role.lower()
    if any(k in role_lower for k in ["front", "react", "ui", "web"]):
        return DEFAULT_FALLBACK_QUESTIONS["frontend"]
    else:
        return DEFAULT_FALLBACK_QUESTIONS["backend"]

# ─── Endpoint ─────────────────────────────────────────────────────────────────
@router.post("/interview/generate", response_model=List[InterviewQuestionSchema])
def generate_interview(
    payload: InterviewGenerateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates 5-8 interview questions (mix of technical and HR) tailored to the candidate.
    Saves the session in database and returns the flat questions list.
    """
    # 1. Fetch Career Profile to get candidate skills
    profile = db.query(CareerProfile).filter(CareerProfile.student_id == current_user.id).first()
    skills_list = profile.skills if (profile and profile.skills) else ["Software Development"]

    # 2. Call Hugging Face API to generate questions
    generated_questions = []
    
    if settings.HUGGINGFACE_API_KEY:
        try:
            client = InferenceClient(
                model="Qwen/Qwen2.5-Coder-7B-Instruct",
                token=settings.HUGGINGFACE_API_KEY,
                timeout=30.0
            )
            
            user_prompt = USER_PROMPT_TEMPLATE.format(
                count=6,
                target_role=payload.target_role,
                difficulty=payload.difficulty,
                skills=", ".join(skills_list)
            )
            
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
            
            response = client.chat.completions.create(
                messages=messages,
                max_tokens=2048,
                temperature=0.3
            )
            
            response_text = response.choices[0].message.content
            cleaned_response = clean_json_response(response_text)
            
            data = json.loads(cleaned_response)
            generated_questions = data.get("questions", [])
            
        except Exception as e:
            logger.error(f"HF interview generation failed: {e}. Using fallback.")
            generated_questions = get_fallback_questions(payload.target_role)
    else:
        logger.warning("HUGGINGFACE_API_KEY not configured. Using fallback.")
        generated_questions = get_fallback_questions(payload.target_role)

    # 3. Format generated list into Pydantic models for validation
    validated_questions = []
    for q in generated_questions:
        validated_questions.append(InterviewQuestionSchema(
            question=q.get("question", "Tell me about yourself."),
            type=q.get("type", "hr"),
            difficulty=q.get("difficulty", payload.difficulty),
            model_answer=q.get("model_answer", "Professional response summary."),
            follow_up=q.get("follow_up")
        ))

    # 4. Save session in interview_sessions table
    try:
        db_session = InterviewSession(
            student_id=current_user.id,
            role=payload.target_role,
            questions=[q.dict() for q in validated_questions]
        )
        db.add(db_session)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save interview session to database: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save interview session to database."
        )

    # 5. Return the flat questions list directly to matches frontend signature
    return validated_questions
