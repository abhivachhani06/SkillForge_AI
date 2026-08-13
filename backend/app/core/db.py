import uuid
from sqlalchemy import create_engine, Column, String, Integer, Numeric, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Adjust URL format for SQLAlchemy (postgres:// -> postgresql://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Configure database engine
engine = create_engine(
    db_url,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─── Database Dependency ──────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── Models ───────────────────────────────────────────────────────────────────

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True)
    full_name = Column(Text)
    education = Column(Text)
    experience_level = Column(Text)
    target_role = Column(Text)
    interests = Column(ARRAY(Text))
    preferred_learning_hours = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    file_name = Column(Text)
    raw_text = Column(Text)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

class CareerProfile(Base):
    __tablename__ = "career_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), unique=True)
    skills = Column(JSONB)
    education = Column(JSONB)
    experience = Column(JSONB)
    projects = Column(JSONB)
    summary = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    skill = Column(Text)
    severity = Column(Text)
    why_it_matters = Column(Text)
    readiness_component_score = Column(Numeric)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RoadmapTask(Base):
    __tablename__ = "roadmap_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    title = Column(Text)
    description = Column(Text)
    priority = Column(Text)
    estimated_hours = Column(Numeric)
    prerequisites = Column(ARRAY(Text))
    status = Column(Text, default="pending")  # 'pending', 'in_progress', 'done'
    week_number = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    type = Column(Text)
    title = Column(Text)
    description = Column(Text)
    reason = Column(Text)
    difficulty = Column(Text)
    estimated_duration = Column(Text)
    expected_outcome = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    role = Column(Text)
    questions = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MentorMessage(Base):
    __tablename__ = "mentor_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    role = Column(Text)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ReadinessScore(Base):
    __tablename__ = "readiness_scores"

    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), primary_key=True)
    score = Column(Numeric)
    breakdown = Column(JSONB)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
