import json
import logging
from huggingface_hub import InferenceClient
from app.core.config import settings
from app.schemas.career_profile import SkillGapAnalysisSchema, SkillGapItem
from app.prompts.gap_analysis_prompt import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.services.skill_extractor import clean_json_response, call_huggingface_with_retry

logger = logging.getLogger("gap_analysis")

def rule_based_gap_analyst(skills: list, target_role: str, experience_level: str) -> SkillGapAnalysisSchema:
    """
    Fallback method that compares skills list and target role to generate 
    a realistic gap analysis structure when LLM is unavailable.
    """
    logger.info("Running deterministic rule-based gap analysis...")
    skills_lower = [s.lower() for s in skills]
    target_lower = target_role.lower()
    
    # 1. Identify strengths
    strengths = []
    for s in skills:
        if len(strengths) < 5:
            strengths.append(f"Familiarity with {s}")
            
    # 2. Pre-seeded gaps mapping
    gaps = []
    
    # Check Frontend Gaps
    if any(k in target_lower for k in ["front", "react", "next"]):
        if not any(x in skills_lower for x in ["react", "angular", "vue"]):
            gaps.append(SkillGapItem(
                skill="React or Modern Frontend Framework",
                severity="high",
                why_it_matters=f"Building interactive user interfaces for a {target_role} role requires deep framework knowledge.",
                readiness_component_score=30.0
            ))
        if "typescript" not in skills_lower:
            gaps.append(SkillGapItem(
                skill="TypeScript",
                severity="medium",
                why_it_matters="TypeScript is standard in enterprise frontend projects to ensure type safety and prevent runtime errors.",
                readiness_component_score=45.0
            ))
        if "next.js" not in skills_lower:
            gaps.append(SkillGapItem(
                skill="Next.js / SSR",
                severity="medium",
                why_it_matters="Next.js is the preferred framework for modern server-side rendered applications.",
                readiness_component_score=50.0
            ))
            
    # Check Backend Gaps
    elif any(k in target_lower for k in ["back", "python", "api", "node"]):
        if not any(x in skills_lower for x in ["fastapi", "django", "flask", "express", "node"]):
            gaps.append(SkillGapItem(
                skill="API Frameworks (FastAPI / Express)",
                severity="high",
                why_it_matters="Designing scalable endpoints is the core responsibility of backend engineers.",
                readiness_component_score=25.0
            ))
        if not any(x in skills_lower for x in ["postgresql", "mysql", "mongodb", "sql"]):
            gaps.append(SkillGapItem(
                skill="Database Design & SQL",
                severity="medium",
                why_it_matters="Writing optimized database queries is essential for application responsiveness.",
                readiness_component_score=40.0
            ))
            
    # Check Cloud / DevOps Gaps
    elif any(k in target_lower for k in ["devops", "cloud", "sre", "platform"]):
        if not any(x in skills_lower for x in ["docker", "kubernetes"]):
            gaps.append(SkillGapItem(
                skill="Docker & Containerization",
                severity="high",
                why_it_matters="Containerization is mandatory for standard DevOps continuous deployment pipelines.",
                readiness_component_score=20.0
            ))
        if not any(x in skills_lower for x in ["aws", "gcp", "azure"]):
            gaps.append(SkillGapItem(
                skill="Cloud Platforms (AWS)",
                severity="high",
                why_it_matters="Managing remote cloud infrastructure is a primary task of cloud operations.",
                readiness_component_score=30.0
            ))

    # Generic Tech Gaps (to guarantee at least 3 gaps)
    if "system design" not in skills_lower and len(gaps) < 3:
        gaps.append(SkillGapItem(
            skill="System Design & Architecture",
            severity="high",
            why_it_matters=f"As a developer, understanding load balancing, caching, and microservices is crucial for scaling platforms.",
            readiness_component_score=20.0
        ))
    if not any(x in skills_lower for x in ["docker", "kubernetes"]) and len(gaps) < 3:
        gaps.append(SkillGapItem(
            skill="Containerization (Docker)",
            severity="medium",
            why_it_matters="Using Docker containers ensures consistency across development and production environments.",
            readiness_component_score=45.0
        ))
    if not any(x in skills_lower for x in ["aws", "gcp", "azure"]) and len(gaps) < 3:
        gaps.append(SkillGapItem(
            skill="AWS / Cloud Services",
            severity="medium",
            why_it_matters="Deploying apps on cloud instances like EC2 or ECS is standard in modern organizations.",
            readiness_component_score=50.0
        ))

    # Add a fallback gap just in case
    if len(gaps) == 0:
        gaps.append(SkillGapItem(
            skill="Technical Specialization",
            severity="low",
            why_it_matters="Deepening skills in your target role domain will accelerate career progression.",
            readiness_component_score=65.0
        ))

    return SkillGapAnalysisSchema(
        strengths=strengths if strengths else ["Basic Coding"],
        gaps=gaps
    )

def analyze_gaps(skills: list, target_role: str, experience_level: str) -> SkillGapAnalysisSchema:
    """
    Analyzes skill gaps against target role and experience level using HF API.
    Falls back to deterministic rule-based analysis on failure/timeouts.
    """
    if not settings.HUGGINGFACE_API_KEY:
        logger.warning("HUGGINGFACE_API_KEY not set. Using rule-based fallback analysis.")
        return rule_based_gap_analyst(skills, target_role, experience_level)

    try:
        client = InferenceClient(
            model="Qwen/Qwen2.5-Coder-7B-Instruct",
            token=settings.HUGGINGFACE_API_KEY,
            timeout=30.0
        )
        
        user_prompt = USER_PROMPT_TEMPLATE.format(
            target_role=target_role,
            experience_level=experience_level,
            skills=skills
        )
        json_str = call_huggingface_with_retry(client, SYSTEM_PROMPT, user_prompt)
        parsed_data = json.loads(json_str)
        
        # Validate structure with Pydantic
        return SkillGapAnalysisSchema(**parsed_data)
        
    except Exception as e:
        logger.error(f"Hugging Face gap analysis failed: {e}. Falling back to deterministic rule-based analyst.")
        return rule_based_gap_analyst(skills, target_role, experience_level)
