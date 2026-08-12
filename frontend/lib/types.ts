// ─── Data Contracts ────────────────────────────────────────────────────────────
// These types match the exact JSON shapes agreed with the backend teams.

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface Experience {
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface Project {
  title: string;
  description: string;
  tech_used: string[];
}

export interface CareerProfile {
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  summary: string;
}

export interface SkillGap {
  skill: string;
  severity: "low" | "medium" | "high";
  why_it_matters: string;
  readiness_component_score: number;
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  estimated_hours: number;
  prerequisites: string[];
  status: "pending" | "in_progress" | "done";
  week_number: number;
}

export interface Recommendation {
  type: "course" | "certification" | "project" | "interview_resource";
  title: string;
  description: string;
  reason: string;
  difficulty?: string;
  estimated_duration?: string;
  expected_outcome?: string;
}

export interface InterviewQuestion {
  question: string;
  type: "technical" | "hr";
  difficulty: string;
  model_answer: string;
  follow_up?: string;
}

export interface ProgressSummary {
  readiness_score: number;
  breakdown: Record<string, number>;
  roadmap_progress_pct: number;
}

export interface StudentProfile {
  id: string;
  email: string;
  name: string;
  target_role: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  onboarding_complete: boolean;
}

export interface OnboardingPayload {
  education: string;
  current_skills: string[];
  interests: string[];
  target_role: string;
  experience_level: string;
  preferred_learning_hours_per_week: number;
}

export interface MentorMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
