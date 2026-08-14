"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
  UploadCloud, FileText, CheckCircle2, Loader2,
  AlertCircle, Info, ChevronRight, Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { uploadResume, getSkillGaps, generateRoadmap } from "@/lib/api";
import SkillBadge from "@/components/SkillBadge";
import ErrorState from "@/components/ErrorState";
import type { CareerProfile, SkillGap } from "@/lib/types";

type Stage = "upload" | "analyzing" | "results" | "error";

const TARGET_ROLES = [
  "Full-Stack Software Engineer", "Frontend Developer", "Backend Developer",
  "DevOps / SRE Engineer", "Data Engineer", "Machine Learning Engineer",
  "Mobile Developer", "Cloud Solutions Architect",
];

const SAMPLE_RESUME_TEXT = `Bhalani Smit
Email: sbbhalani11@gmail.com | Contact: 9723267639
GitHub: github.com/SBTechLab | LeetCode: leetcode.com/smit_18
Location: Jamjodhpur, Jamnagar, Gujarat

CAREER OBJECTIVE
I want to work as a Front-End Web Developer & Mobile App Developer where I can use my technical skills and improve my knowledge while creating user-friendly websites.

SKILLS
Languages: C, C++, Java, Flutter, Dart, JavaScript
Web: React.js (Beginner), HTML, CSS, Tailwind CSS
Backend: Node.js, Express.js, Python, Django (basic)
Database: MySQL, PostgreSQL, Supabase, Prisma ORM
Tools: Git, GitHub, JWT Authentication, Nodemailer, Razorpay
Mobile: Flutter

INTERNSHIPS
- Python Django Internship (15 Days): Learned backend web development using Python and Django.
- Flutter Internship (45 Days): Developed mobile application UI using Flutter and Dart.
- Algo-Master Internship (25 Days): Real-world implementation, preparing for coding interviews.

EDUCATION
10th Board - 2020 - Gujarat State Secondary Education Board - 83%
Diploma in Computer Engineering - 2022-2025 - Government Polytechnic Gandhinagar - GTU - 8.59 CGPA
B.Tech Computer Engineering - 2025-2028 - Chandubhai S. Patel Institute of Technology (Changa) - CHARUSAT - 7.43 SGPA (up to Sem 4)

PROJECTS

1. FoodWave (Mobile Application) - Diploma Project
Tech: Flutter, Dart, Razorpay
Developed a mobile application where users can browse food items and place orders. Implemented demo payment feature using Razorpay. Designed and developed the complete frontend of the mobile application.

2. Academic Event Management System (Web Application) - B.Tech Sem 3
Tech: React.js, Node.js, Express.js, Supabase, PostgreSQL, Tailwind CSS, JWT Authentication, Nodemailer
Developed a full-stack web application to manage department events with role-based access for Admin, Faculty, Coordinator, and Student. Supports event creation, approval, student registration, and automatic email notifications. Developed backend, implemented JWT authentication, managed database using Supabase, and added email notification feature.

3. SocietyOS: AI-Driven Society Management (Web Application) - B.Tech Sem 5 (Ongoing)
Tech: React.js, Vite, JavaScript, Node.js, Express.js, PostgreSQL, Prisma ORM, Supabase, Tailwind CSS
Developing a SaaS-based web application to digitally manage residential societies including residents, visitors, deliveries, notices, complaints, and society activities. Implementing role-based authentication, database management, and core society management modules.

ACHIEVEMENTS
- Certified: Introduction to Java (Coursera)
- Certified: Java Class Library (Coursera)
- Certified: Introduction to Software Product Management (Coursera)
- Certified: Data Structures and Algorithm Analysis (Coursera)
- Certified: Database Management (NPTEL)
- Certified: Software Engineering (NPTEL)

PERSONAL
Nationality: Indian | Gender: Male | DOB: 20 November 2004
Languages: Gujarati, Hindi, English
`;

function makeSampleFile(): File {
  const blob = new Blob([SAMPLE_RESUME_TEXT], { type: "text/plain" });
  return new File([blob], "sample_resume.pdf", { type: "application/pdf" });
}

export default function ResumeUploadPage() {
  const router = useRouter();
  const [stage, setStage]       = useState<Stage>("upload");
  const [file, setFile]         = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState(TARGET_ROLES[0]);
  const [profile, setProfile]   = useState<CareerProfile | null>(null);
  const [gaps, setGaps]         = useState<SkillGap[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [tooltip, setTooltip]   = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    setStage("analyzing");

    try {
      const [careerProfile, skillGaps] = await Promise.all([
        uploadResume(file, targetRole),
        getSkillGaps(),
      ]);
      setProfile(careerProfile);
      setGaps(skillGaps);
      // Auto-generate roadmap after resume upload
      await generateRoadmap(targetRole).catch(() => {});
      setStage("results");
    } catch (e: any) {
      setErrorMsg(e.message ?? "Upload failed");
      setStage("error");
    }
  };

  const severityColor: Record<SkillGap["severity"], string> = {
    high:   "border-rose-500/40 bg-rose-500/10",
    medium: "border-amber-500/40 bg-amber-500/10",
    low:    "border-emerald-500/40 bg-emerald-500/10",
  };

  return (
    <div className="relative min-h-screen bg-surface px-4 py-12">
      <div className="orb h-72 w-72 bg-brand-600 -top-10 right-0 opacity-20" />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="section-label mb-3">Step 2 of 3</p>
          <h1 className="font-display text-4xl font-bold text-white">Upload your resume</h1>
          <p className="mt-3 text-slate-400">Our AI will extract your skills and identify the gaps for your target role</p>
        </div>

        {/* ── Upload Stage ── */}
        {stage === "upload" && (
          <div className="space-y-6">
            {/* Target role */}
            <div className="glass-card p-6">
              <label htmlFor="target-role-select" className="mb-2 block text-sm font-medium text-slate-300">
                Target role
              </label>
              <select
                id="target-role-select"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="input-field"
              >
                {TARGET_ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={clsx(
                "glass-card cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200",
                isDragActive
                  ? "border-brand-500 bg-brand-500/10"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-surface-border hover:border-brand-500/50 hover:bg-surface-muted/50"
              )}
            >
              <input {...getInputProps()} aria-label="Resume file upload" />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                    <FileText size={28} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 size={16} />
                    Ready to analyze
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/20">
                    <UploadCloud size={32} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-200">
                      {isDragActive ? "Drop it here!" : "Drag & drop your resume"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">or click to browse</p>
                    <p className="mt-2 text-xs text-slate-600">Supports PDF, DOCX · Max 10MB</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file}
              className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed gap-2"
            >
              Analyze my resume
              <ChevronRight size={20} />
            </button>

            {/* Sample Resume Option */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-xs text-slate-500">or</span>
              <div className="flex-1 h-px bg-surface-border" />
            </div>
            <button
              onClick={() => setFile(makeSampleFile())}
              className="btn-ghost w-full py-3 gap-2 text-sm border border-dashed border-brand-500/40 hover:border-brand-500/70"
            >
              <Sparkles size={16} className="text-brand-400" />
              Use Sample Resume — no file needed
            </button>
          </div>
        )}

        {/* ── Analyzing Stage ── */}
        {stage === "analyzing" && (
          <div className="glass-card p-16 text-center">
            <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-brand-500/15 border border-brand-500/30">
              <Loader2 size={36} className="text-brand-400 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Analyzing your resume…</h2>
            <p className="text-slate-400">Our AI is extracting skills, experience, and identifying gaps. This takes 5–15 seconds.</p>

            <div className="mt-8 space-y-2 text-left max-w-sm mx-auto">
              {["Parsing resume content…", "Extracting skills & experience…", "Mapping to target role requirements…", "Computing readiness score…"].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Loader2 size={14} className="text-brand-400 animate-spin flex-shrink-0" style={{ animationDelay: `${i * 200}ms` }} />
                  <span className="text-slate-400">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error Stage ── */}
        {stage === "error" && (
          <ErrorState
            message={errorMsg}
            onRetry={() => setStage("upload")}
          />
        )}

        {/* ── Results Stage ── */}
        {stage === "results" && profile && (
          <div className="space-y-6 animate-fade-in">
            {/* Career Profile */}
            <div className="glass-card p-6">
              <h2 className="mb-1 text-xl font-semibold text-slate-100">Extracted Profile</h2>
              <p className="mb-4 text-sm text-slate-400">{profile.summary}</p>

              <div className="mb-4">
                <p className="section-label mb-2">Current Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => <SkillBadge key={s} label={s} />)}
                </div>
              </div>

              {profile.experience.length > 0 && (
                <div className="mb-4">
                  <p className="section-label mb-2">Experience</p>
                  {profile.experience.map((e, i) => (
                    <div key={i} className="mb-2">
                      <span className="font-medium text-slate-200">{e.role}</span>
                      <span className="text-slate-500"> @ {e.company}</span>
                      <span className="ml-2 text-xs text-slate-600">· {e.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skill Gaps */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-100">Skill Gaps Identified</h2>
                <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-xs text-rose-300">
                  {gaps.filter((g) => g.severity === "high").length} critical
                </span>
              </div>

              <div className="space-y-3">
                {gaps.map((gap) => (
                  <div
                    key={gap.skill}
                    className={clsx(
                      "relative rounded-xl border p-4",
                      severityColor[gap.severity]
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <SkillBadge label={gap.skill} variant={gap.severity} />
                        <button
                          onClick={() => setTooltip(tooltip === gap.skill ? null : gap.skill)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          aria-label={`Why ${gap.skill} matters`}
                        >
                          <Info size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Readiness</span>
                        <span className="text-sm font-semibold text-slate-200">{gap.readiness_component_score}%</span>
                      </div>
                    </div>

                    {tooltip === gap.skill && (
                      <div className="mt-3 rounded-lg bg-surface/70 px-3 py-2 text-xs text-slate-300 border border-surface-border">
                        <AlertCircle size={12} className="inline mr-1 text-amber-400" />
                        {gap.why_it_matters}
                      </div>
                    )}

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-border">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-700"
                        style={{ width: `${gap.readiness_component_score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-primary flex-1 py-4 text-base gap-2"
              >
                View my dashboard
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => { setFile(null); setStage("upload"); }}
                className="btn-ghost px-6"
              >
                Re-upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
