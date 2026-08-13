/**
 * lib/api.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All API calls go through this file. Toggle USE_MOCKS to switch between
 * mock data (development) and real backend endpoints (production).
 *
 * To swap a single function to real: set its mock flag to false and ensure
 * NEXT_PUBLIC_API_BASE_URL is set in .env.local.
 */

import { supabase } from "./supabaseClient";
import {
  mockCareerProfile,
  mockSkillGaps,
  mockRoadmapTasks,
  mockRecommendations,
  mockInterviewQuestions,
  mockProgressSummary,
  mockStudentProfile,
  mockMentorHistory,
  mockDelay,
} from "./mocks";

import type {
  CareerProfile,
  SkillGap,
  RoadmapTask,
  Recommendation,
  InterviewQuestion,
  ProgressSummary,
  StudentProfile,
  OnboardingPayload,
  MentorMessage,
} from "./types";

// ─── Feature flag ─────────────────────────────────────────────────────────────
// Set to false once a real endpoint is confirmed with the backend team.
const USE_MOCKS = false;

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ─── Auth helper ─────────────────────────────────────────────────────────────
async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// ─── Generic fetch wrapper ────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Member 2: Student / Auth ─────────────────────────────────────────────────

export async function getStudentProfile(): Promise<StudentProfile> {
  if (USE_MOCKS) { await mockDelay(); return mockStudentProfile; }
  return apiFetch<StudentProfile>("/api/students/me");
}

export async function submitOnboarding(payload: OnboardingPayload): Promise<void> {
  if (USE_MOCKS) { await mockDelay(1200); return; }
  await apiFetch<void>("/api/students/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Member 1: Resume / Skill Gaps ───────────────────────────────────────────

export async function uploadResume(file: File, targetRole: string): Promise<CareerProfile> {
  if (USE_MOCKS) { await mockDelay(2500); return mockCareerProfile; }
  const headers = await authHeaders();
  const form = new FormData();
  form.append("file", file);
  form.append("target_role", targetRole);
  const res = await fetch(`${BASE}/api/resume/upload`, {
    method: "POST",
    headers: { Authorization: headers.Authorization ?? "" },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function getCareerProfile(): Promise<CareerProfile> {
  if (USE_MOCKS) { await mockDelay(); return mockCareerProfile; }
  return apiFetch<CareerProfile>("/api/resume/profile");
}

export async function getSkillGaps(): Promise<SkillGap[]> {
  if (USE_MOCKS) { await mockDelay(); return mockSkillGaps; }
  return apiFetch<SkillGap[]>("/api/gaps");
}

// ─── Member 2: Roadmap / Progress ────────────────────────────────────────────

export async function getRoadmap(): Promise<RoadmapTask[]> {
  if (USE_MOCKS) { await mockDelay(); return mockRoadmapTasks; }
  return apiFetch<RoadmapTask[]>("/api/roadmap");
}

export async function updateRoadmapTask(
  id: string,
  status: RoadmapTask["status"]
): Promise<RoadmapTask> {
  if (USE_MOCKS) {
    await mockDelay(400);
    const task = mockRoadmapTasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    return { ...task, status };
  }
  return apiFetch<RoadmapTask>(`/api/roadmap/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getProgressSummary(): Promise<ProgressSummary> {
  if (USE_MOCKS) { await mockDelay(); return mockProgressSummary; }
  return apiFetch<ProgressSummary>("/api/progress/summary");
}

// ─── Member 4: Recommendations / Interview / Mentor ──────────────────────────

export async function generateRoadmap(targetRole: string): Promise<RoadmapTask[]> {
  if (USE_MOCKS) { await mockDelay(3000); return mockRoadmapTasks; }
  return apiFetch<RoadmapTask[]>("/api/roadmap/generate", {
    method: "POST",
    body: JSON.stringify({ target_role: targetRole }),
  });
}

export async function getRecommendations(): Promise<Recommendation[]> {
  if (USE_MOCKS) { await mockDelay(); return mockRecommendations; }
  return apiFetch<Recommendation[]>("/api/recommendations");
}

export async function generateInterviewQuestions(targetRole: string): Promise<InterviewQuestion[]> {
  if (USE_MOCKS) { await mockDelay(1500); return mockInterviewQuestions; }
  return apiFetch<InterviewQuestion[]>("/api/interview/generate", {
    method: "POST",
    body: JSON.stringify({ target_role: targetRole }),
  });
}

export async function sendMentorMessage(
  message: string,
  history: MentorMessage[]
): Promise<MentorMessage> {
  if (USE_MOCKS) {
    await mockDelay(1200);
    const responses: string[] = [
      "Great question! For System Design interviews, I recommend starting with capacity estimation — it shows structured thinking right from the start. Want me to walk you through a sample estimation for a URL shortener?",
      "For AWS Cloud Practitioner, the three areas to focus on are core services (EC2, S3, RDS), pricing models (on-demand vs reserved vs spot), and the Shared Responsibility Model. Should I create a study schedule for you?",
      "Your project portfolio is actually your strongest asset — 75th percentile for your experience level. I'd recommend adding deployment links and a short video demo to each project. GitHub Stars and live demos increase recruiter callback rates by ~35%.",
      "Absolutely! Docker fundamentals take about a weekend to pick up if you have Node.js experience. Start with `docker build`, `docker run`, and `docker-compose`. Want me to recommend a hands-on project to cement the concepts?",
    ];
    const content = responses[Math.floor(Math.random() * responses.length)];
    return {
      role: "assistant",
      content,
      timestamp: new Date().toISOString(),
    };
  }
  return apiFetch<MentorMessage>("/api/mentor/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}

export async function getMentorHistory(): Promise<MentorMessage[]> {
  if (USE_MOCKS) { await mockDelay(300); return mockMentorHistory; }
  return apiFetch<MentorMessage[]>("/api/mentor/history");
}
