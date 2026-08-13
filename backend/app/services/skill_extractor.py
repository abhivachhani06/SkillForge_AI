import json
import logging
import re
from huggingface_hub import InferenceClient
from app.core.config import settings
from app.schemas.career_profile import CareerProfileSchema
from app.prompts.skill_extraction_prompt import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE

logger = logging.getLogger("skill_extractor")

# A pre-seeded dictionary of skills for the keyword-matching fallback
COMMON_SKILLS = [
    "python", "javascript", "typescript", "react", "next.js", "node.js", "express", "fastapi", 
    "django", "flask", "html", "css", "tailwind", "postgresql", "mysql", "mongodb", "redis", 
    "aws", "docker", "kubernetes", "git", "github", "ci/cd", "java", "c++", "c#", "ruby", "go",
    "rust", "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn", "sql", "nosql", "rest api"
]

def deterministic_skill_extractor(raw_text: str) -> CareerProfileSchema:
    """
    Fallback method that scans the raw text using regex to match common skills 
    and construct a basic CareerProfileSchema when LLM is unavailable.
    """
    logger.info("Running deterministic fallback skill extractor...")
    text_lower = raw_text.lower()
    
    # 1. Match skills
    found_skills = []
    for skill in COMMON_SKILLS:
        # Match word boundaries to prevent partial match issues (e.g. "go" in "good")
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            # Preserve capitalization of common terms
            capitalized = {
                "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript",
                "react": "React", "next.js": "Next.js", "node.js": "Node.js", "express": "Express",
                "fastapi": "FastAPI", "django": "Django", "flask": "Flask", "html": "HTML",
                "css": "CSS", "tailwind": "Tailwind CSS", "postgresql": "PostgreSQL", "mysql": "MySQL",
                "mongodb": "MongoDB", "redis": "Redis", "aws": "AWS", "docker": "Docker",
                "kubernetes": "Kubernetes", "git": "Git", "github": "GitHub", "ci/cd": "CI/CD",
                "java": "Java", "c++": "C++", "c#": "C#", "ruby": "Ruby", "go": "Go", "rust": "Rust",
                "pandas": "Pandas", "numpy": "NumPy", "tensorflow": "TensorFlow", "pytorch": "PyTorch",
                "scikit-learn": "Scikit-Learn", "sql": "SQL", "nosql": "NoSQL", "rest api": "REST APIs"
            }.get(skill, skill.title())
            found_skills.append(capitalized)

    # 2. Match education-like lines
    education = []
    edu_keywords = ["university", "college", "institute", "b.tech", "m.tech", "bachelor", "master", "degree", "ph.d"]
    for line in raw_text.split("\n"):
        line_clean = line.strip()
        if any(keyword in line_clean.lower() for keyword in edu_keywords):
            # Limit length to keep it clean
            if 15 < len(line_clean) < 100:
                education.append({
                    "degree": "Degree / Study Profile",
                    "institution": line_clean,
                    "year": "N/A"
                })
                if len(education) >= 2:
                    break

    # If no education found, add a placeholder
    if not education:
        education.append({
            "degree": "Degree/Certification",
            "institution": "Self-Taught / Online Courses",
            "year": "N/A"
        })

    # 3. Create dummy experiences/projects for fallback stability
    experience = [{
        "role": "Developer / Professional",
        "company": "Company / Projects",
        "duration": "N/A",
        "description": "Professional experience described in uploaded resume."
    }]

    projects = [{
        "title": "Portfolio Project",
        "description": "Personal development projects.",
        "tech_used": found_skills[:4] if found_skills else ["Software Engineering"]
    }]

    summary = "Developer with experience in software development and technical systems."
    if found_skills:
        summary += f" Proficient in {', '.join(found_skills[:5])}."

    return CareerProfileSchema(
        skills=found_skills if found_skills else ["General IT"],
        education=education,
        experience=experience,
        projects=projects,
        summary=summary
    )

def clean_json_response(raw_text: str) -> str:
    """Removes markdown code block backticks if present in LLM response."""
    cleaned = raw_text.strip()
    # Match markdown fence block if present
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
    if match:
        cleaned = match.group(1).strip()
    # If the response contains extra characters before the first { or after the last }
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1:
        cleaned = cleaned[start:end+1]
    return cleaned

def call_huggingface_with_retry(client: InferenceClient, system_prompt: str, user_prompt: str, retries: int = 1) -> str:
    """Calls Hugging Face Serverless API and handles corrective retry if parsing fails."""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    # First attempt
    response = client.chat.completions.create(
        messages=messages,
        max_tokens=2000,
        temperature=0.1
    )
    result = response.choices[0].message.content
    logger.debug(f"HF Raw Response (Attempt 1): {result}")
    
    try:
        cleaned = clean_json_response(result)
        json.loads(cleaned)
        return cleaned
    except (json.JSONDecodeError, ValueError) as e:
        if retries > 0:
            logger.warning(f"Failed to parse JSON response. Attempting corrective retry. Error: {e}")
            messages.append({"role": "assistant", "content": result})
            messages.append({"role": "user", "content": "Your response was invalid JSON. Return ONLY the valid JSON object, starting with { and ending with }."})
            
            retry_response = client.chat.completions.create(
                messages=messages,
                max_tokens=2000,
                temperature=0.1
            )
            retry_result = retry_response.choices[0].message.content
            logger.debug(f"HF Raw Response (Attempt 2): {retry_result}")
            return clean_json_response(retry_result)
        else:
            raise e

def extract_skills(raw_text: str) -> CareerProfileSchema:
    """
    Parses resume text using Hugging Face serverless API.
    Falls back to deterministic regex parsing if API fails/times out.
    """
    if not settings.HUGGINGFACE_API_KEY:
        logger.warning("HUGGINGFACE_API_KEY not set. Using fallback extractor.")
        return deterministic_skill_extractor(raw_text)

    try:
        client = InferenceClient(
            model="Qwen/Qwen2.5-Coder-7B-Instruct",
            token=settings.HUGGINGFACE_API_KEY,
            timeout=30.0
        )
        
        user_prompt = USER_PROMPT_TEMPLATE.format(resume_text=raw_text)
        json_str = call_huggingface_with_retry(client, SYSTEM_PROMPT, user_prompt)
        parsed_data = json.loads(json_str)
        
        # Validate structure with Pydantic
        return CareerProfileSchema(**parsed_data)
        
    except Exception as e:
        logger.error(f"Hugging Face extraction failed: {e}. Falling back to deterministic extractor.")
        return deterministic_skill_extractor(raw_text)
