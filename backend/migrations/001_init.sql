-- Migration: 001_init.sql
-- Description: Create all 9 tables for the SkillForge AI platform.

-- 1. Students table (linked to Supabase auth users)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  education TEXT,
  experience_level TEXT,
  target_role TEXT,
  interests TEXT[],
  preferred_learning_hours INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  file_name TEXT,
  raw_text TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Career Profiles table (one per student)
CREATE TABLE IF NOT EXISTS career_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  skills JSONB,
  education JSONB,
  experience JSONB,
  projects JSONB,
  summary TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Skill Gaps table
CREATE TABLE IF NOT EXISTS skill_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  skill TEXT,
  severity TEXT,
  why_it_matters TEXT,
  readiness_component_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Roadmap Tasks table
CREATE TABLE IF NOT EXISTS roadmap_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  priority TEXT,
  estimated_hours NUMERIC,
  prerequisites TEXT[],
  status TEXT DEFAULT 'pending',
  week_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  description TEXT,
  reason TEXT,
  difficulty TEXT,
  estimated_duration TEXT,
  expected_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Interview Sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  role TEXT,
  questions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Mentor Messages table
CREATE TABLE IF NOT EXISTS mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Readiness Scores table
CREATE TABLE IF NOT EXISTS readiness_scores (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE PRIMARY KEY,
  score NUMERIC,
  breakdown JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
