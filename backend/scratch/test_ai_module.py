import os
import sys
import logging

# Ensure backend directory is in the system path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.skill_extractor import extract_skills
from app.services.gap_analysis import analyze_gaps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_ai_module")

def run_tests():
    logger.info("Starting verification tests for Resume Intelligence module...")
    
    # 1. Print API Key check
    logger.info(f"Hugging Face Token Configured: {'Yes' if settings.HUGGINGFACE_API_KEY else 'No'}")
    
    # 2. Test Resume Text
    sample_resume = """
    JOHN DOE
    Email: john.doe@email.com | Phone: 123-456-7890
    
    PROFESSIONAL SUMMARY:
    Detail-oriented Software Developer with 2+ years of experience building modern web applications.
    Specialized in frontend interfaces using React, but with solid backend exposure.
    
    EDUCATION:
    Bachelor of Technology in Computer Science
    Nirma University, Class of 2024
    
    EXPERIENCE:
    Software Engineer Intern | TechStart Pvt. Ltd. (June 2023 - December 2023)
    - Developed clean and responsive UI layouts in React.
    - Worked with Node.js and Express to build RESTful APIs.
    - Improved page load speeds by 20%.
    
    PROJECTS:
    DevBlog Platform:
    - Built a full-stack blogging system using Next.js, Node.js, and PostgreSQL.
    - Implemented secure JWT authentication.
    
    SKILLS:
    Programming: Python, JavaScript, TypeScript
    Frameworks: React, Next.js, Node.js, Express, FastAPI
    Databases: PostgreSQL, MongoDB, Redis
    Tools: Git, Docker, AWS
    """
    
    # 3. Test Skill Extraction
    logger.info("Testing Skill Extraction...")
    profile = extract_skills(sample_resume)
    logger.info("Skill Extraction Successful!")
    logger.info(f"Summary: {profile.summary}")
    logger.info(f"Extracted Skills: {profile.skills}")
    logger.info(f"Extracted Education: {profile.education}")
    logger.info(f"Extracted Experience: {profile.experience}")
    logger.info(f"Extracted Projects: {profile.projects}")
    
    # 4. Test Gap Analysis
    logger.info("Testing Gap Analysis...")
    target_role = "DevOps / SRE Engineer"
    experience_level = "beginner"
    analysis = analyze_gaps(profile.skills, target_role, experience_level)
    logger.info("Gap Analysis Successful!")
    logger.info(f"Strengths: {analysis.strengths}")
    logger.info("Identified Gaps:")
    for gap in analysis.gaps:
        logger.info(f"  - Skill: {gap.skill} | Severity: {gap.severity} | Score: {gap.readiness_component_score}%")
        logger.info(f"    Why it matters: {gap.why_it_matters}")

    logger.info("Verification tests completed successfully!")

if __name__ == "__main__":
    run_tests()
