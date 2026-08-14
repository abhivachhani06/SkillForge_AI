import json
import logging
from huggingface_hub import InferenceClient
from app.core.config import settings
from app.schemas.career_profile import SkillGapAnalysisSchema, SkillGapItem
from app.prompts.gap_analysis_prompt import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.services.skill_extractor import clean_json_response, call_huggingface_with_retry

logger = logging.getLogger("gap_analysis")

def rule_based_gap_analyst(skills: list, target_role: str, experience_level: str) -> SkillGapAnalysisSchema:
    logger.info("Running deterministic rule-based gap analysis...")
    skills_lower = [s.lower() for s in skills]
    target_lower = target_role.lower()

    strengths = [f"Familiarity with {s}" for s in skills[:5]] or ["Basic Coding"]
    gaps = []

    # ── Role-specific gaps ────────────────────────────────────────────
    if any(k in target_lower for k in ["full", "front", "react", "next", "web"]):
        if not any(x in skills_lower for x in ["typescript"]):
            gaps.append(SkillGapItem(skill="TypeScript", severity="high",
                why_it_matters="TypeScript is required in almost every modern frontend/full-stack job posting for type safety.",
                readiness_component_score=25.0))
        if not any(x in skills_lower for x in ["next.js", "nextjs"]):
            gaps.append(SkillGapItem(skill="Next.js & Server-Side Rendering", severity="high",
                why_it_matters="Next.js is the industry standard for full-stack React apps with SSR, SSG and API routes.",
                readiness_component_score=20.0))
        if not any(x in skills_lower for x in ["postgresql", "mysql", "mongodb", "sql"]):
            gaps.append(SkillGapItem(skill="Database Design & SQL", severity="high",
                why_it_matters="Full-stack roles require designing schemas and writing optimized queries.",
                readiness_component_score=30.0))
        if not any(x in skills_lower for x in ["node.js", "nodejs", "express", "fastapi"]):
            gaps.append(SkillGapItem(skill="Backend API Development (Node.js / Express)", severity="high",
                why_it_matters="Building REST APIs is a core full-stack responsibility.",
                readiness_component_score=25.0))

    elif any(k in target_lower for k in ["back", "python", "api", "django", "fastapi"]):
        if not any(x in skills_lower for x in ["fastapi", "django", "flask", "express"]):
            gaps.append(SkillGapItem(skill="API Frameworks (FastAPI / Django)", severity="high",
                why_it_matters="Designing scalable endpoints is the core responsibility of backend engineers.",
                readiness_component_score=25.0))
        if not any(x in skills_lower for x in ["postgresql", "mysql", "sql"]):
            gaps.append(SkillGapItem(skill="Database Design & SQL", severity="high",
                why_it_matters="Writing optimized queries is essential for application performance.",
                readiness_component_score=30.0))

    elif any(k in target_lower for k in ["devops", "cloud", "sre"]):
        if not any(x in skills_lower for x in ["docker", "kubernetes"]):
            gaps.append(SkillGapItem(skill="Docker & Kubernetes", severity="high",
                why_it_matters="Containerization is mandatory for modern DevOps pipelines.",
                readiness_component_score=20.0))
        if not any(x in skills_lower for x in ["aws", "gcp", "azure"]):
            gaps.append(SkillGapItem(skill="Cloud Platforms (AWS)", severity="high",
                why_it_matters="Managing cloud infrastructure is the primary task of DevOps/SRE roles.",
                readiness_component_score=25.0))

    # ── Universal gaps always added ───────────────────────────────────
    if not any(x in skills_lower for x in ["system design", "architecture"]):
        gaps.append(SkillGapItem(skill="System Design & Architecture", severity="high",
            why_it_matters="System design interviews are mandatory at mid/senior level at every top tech company.",
            readiness_component_score=20.0))

    if not any(x in skills_lower for x in ["docker"]):
        gaps.append(SkillGapItem(skill="Docker & Containerization", severity="medium",
            why_it_matters="Docker is used in virtually every production deployment pipeline today.",
            readiness_component_score=40.0))

    if not any(x in skills_lower for x in ["aws", "gcp", "azure", "cloud"]):
        gaps.append(SkillGapItem(skill="AWS / Cloud Services", severity="medium",
            why_it_matters="Cloud deployment knowledge is expected even for junior roles at modern companies.",
            readiness_component_score=45.0))

    if not any(x in skills_lower for x in ["ci/cd", "github actions", "jenkins"]):
        gaps.append(SkillGapItem(skill="CI/CD Pipelines", severity="medium",
            why_it_matters="Automating build and deployment pipelines is a standard engineering practice.",
            readiness_component_score=50.0))

    return SkillGapAnalysisSchema(strengths=strengths, gaps=gaps)

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
