import logging
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title="SkillForge AI Backend",
    description="Backend API skeleton, Database Migrations, Auth verification, and Progress Tracking for SkillForge AI.",
    version="1.0.0"
)

# ─── CORS Middleware ──────────────────────────────────────────────────────────
# Allow Next.js frontend origin (default is http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon/development speed. Can be restricted to specific domains.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Import Active Routers (Member 2) ──────────────────────────────────────────
from app.routers import students, roadmap, progress

app.include_router(students.router)
app.include_router(roadmap.router)
app.include_router(progress.router)

# ─── Conditionally Import / Mount Member 1 & Member 4 Routers ──────────────────
# This allows the project to run immediately, but plugs in their real modules when they ship.

# Member 1: Resume & Skill Gaps
try:
    from app.routers import resume
    app.include_router(resume.router)
    logger.info("Successfully mounted Member 1's real resume router.")
except ImportError:
    logger.warning("Member 1's resume router not found. Mounting mock resume & gaps router...")
    
    mock_resume_router = APIRouter(prefix="/api", tags=["mock-resume"])
    
    @mock_resume_router.post("/resume/upload")
    def mock_upload_resume():
        return {
            "summary": "Motivated software developer with 2+ years building React/Node.js web apps.",
            "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "PostgreSQL", "Git", "REST APIs"],
            "education": [{"degree": "B.Tech in Computer Science", "institution": "Nirma University", "year": "2024"}],
            "experience": [{"role": "Software Development Intern", "company": "TechStart Pvt. Ltd.", "duration": "Jun 2023 – Dec 2023", "description": "Built internal dashboard."}],
            "projects": [{"title": "DevBlog Platform", "description": "Full-stack blogging platform.", "tech_used": ["Next.js", "PostgreSQL"]}]
        }
        
    @mock_resume_router.get("/resume/profile")
    def mock_get_profile():
        return {
            "summary": "Motivated software developer with 2+ years building React/Node.js web apps.",
            "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "PostgreSQL", "Git", "REST APIs"],
            "education": [{"degree": "B.Tech in Computer Science", "institution": "Nirma University", "year": "2024"}],
            "experience": [{"role": "Software Development Intern", "company": "TechStart Pvt. Ltd.", "duration": "Jun 2023 – Dec 2023", "description": "Built internal dashboard."}],
            "projects": [{"title": "DevBlog Platform", "description": "Full-stack blogging platform.", "tech_used": ["Next.js", "PostgreSQL"]}]
        }
        
    @mock_resume_router.get("/gaps")
    def mock_get_gaps():
        return [
            {"skill": "System Design", "severity": "high", "why_it_matters": "Senior roles require this.", "readiness_component_score": 22},
            {"skill": "AWS / Cloud Architecture", "severity": "high", "why_it_matters": "Cloud skills are needed.", "readiness_component_score": 30},
            {"skill": "Docker & Kubernetes", "severity": "medium", "why_it_matters": "Containers are standard.", "readiness_component_score": 41}
        ]
        
    app.include_router(mock_resume_router)


# Member 4: Recommendations, Interviews, Mentor, Roadmap Generator
try:
    from app.routers import recommend, interview, mentor
    app.include_router(recommend.router)
    app.include_router(interview.router)
    app.include_router(mentor.router)
    logger.info("Successfully mounted Member 4's real AI & recommendation routers.")
except ImportError:
    logger.warning("Member 4's routers not found. Mounting mock AI recommendation & mentor routers...")
    
    mock_ai_router = APIRouter(prefix="/api", tags=["mock-ai"])
    
    @mock_ai_router.post("/roadmap/generate")
    def mock_generate_roadmap():
        return [
            {"id": "task_01", "title": "Master System Design Fundamentals", "description": "Study CAP, load balancing.", "priority": "high", "estimated_hours": 20, "prerequisites": [], "status": "pending", "week_number": 1},
            {"id": "task_02", "title": "AWS Core Services Prep", "description": "Cover EC2, S3, RDS.", "priority": "high", "estimated_hours": 15, "prerequisites": [], "status": "pending", "week_number": 1}
        ]
        
    @mock_ai_router.get("/recommendations")
    def mock_get_recommendations():
        return [
            {"type": "course", "title": "Grokking the System Design Interview", "description": "FAANG level prep.", "reason": "System Design is a high gap.", "difficulty": "Intermediate", "estimated_duration": "40 hours", "expected_outcome": "Pass interviews."},
            {"type": "project", "title": "Build a Chat App with WebSockets", "description": "Practice scaling.", "reason": "Accelerate design practice.", "difficulty": "Intermediate", "estimated_duration": "15 hours", "expected_outcome": "Portfolio item."}
        ]
        
    @mock_ai_router.post("/interview/generate")
    def mock_generate_interview():
        return [
            {"question": "Design a URL shortening service like bit.ly.", "type": "technical", "difficulty": "hard", "model_answer": "Use base-62 encoding...", "follow_up": "How to scale it?"},
            {"question": "Where do you see yourself in 5 years?", "type": "hr", "difficulty": "easy", "model_answer": "Leading a team...", "follow_up": "What skills will you learn?"}
        ]
        
    @mock_ai_router.post("/mentor/chat")
    def mock_mentor_chat():
        return {
            "role": "assistant",
            "content": "I've reviewed your progress! You're doing great. Focus on closing System Design gaps next.",
            "timestamp": "2026-08-13T18:00:00Z"
        }
        
    @mock_ai_router.get("/mentor/history")
    def mock_mentor_history():
        return [
            {"role": "assistant", "content": "Hi! I'm your AI Career Mentor. How can I help you today?", "timestamp": "2026-08-13T17:59:00Z"}
        ]
        
    app.include_router(mock_ai_router)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to SkillForge AI Backend API!",
        "docs_url": "/docs",
        "status": "online"
    }
