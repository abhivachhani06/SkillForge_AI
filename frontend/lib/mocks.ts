/**
 * lib/mocks.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Realistic mock data used while real API endpoints are not yet available.
 * All shapes match the TypeScript types in lib/types.ts exactly.
 * Swap by toggling USE_MOCKS = false in lib/api.ts once endpoints are live.
 */

import type {
  CareerProfile,
  SkillGap,
  RoadmapTask,
  Recommendation,
  InterviewQuestion,
  ProgressSummary,
  StudentProfile,
  MentorMessage,
} from "./types";

// ─── Simulated network delay ────────────────────────────────────────────────
export const mockDelay = (ms = 800) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Student Profile ─────────────────────────────────────────────────────────
export const mockStudentProfile: StudentProfile = {
  id: "usr_mock_01",
  email: "alex.morgan@example.com",
  name: "Alex Morgan",
  target_role: "Full-Stack Software Engineer",
  experience_level: "intermediate",
  onboarding_complete: true,
};

// ─── Career Profile (from resume parsing) ───────────────────────────────────
export const mockCareerProfile: CareerProfile = {
  summary:
    "Motivated software developer with 2+ years building React/Node.js web apps. Passionate about clean architecture, performance optimization, and AI-driven products.",
  skills: [
    "JavaScript", "TypeScript", "React", "Node.js", "Express",
    "PostgreSQL", "Git", "REST APIs", "HTML/CSS", "Tailwind CSS",
  ],
  education: [
    {
      degree: "B.Tech in Computer Science",
      institution: "Nirma University",
      year: "2024",
    },
  ],
  experience: [
    {
      role: "Software Development Intern",
      company: "TechStart Pvt. Ltd.",
      duration: "Jun 2023 – Dec 2023",
      description:
        "Built internal dashboard with React + D3.js reducing reporting time by 40%. Wrote REST endpoints in Express, deployed to AWS EC2.",
    },
  ],
  projects: [
    {
      title: "DevBlog Platform",
      description:
        "Full-stack blogging platform with markdown support, JWT auth, and comment threads. 200+ active users.",
      tech_used: ["Next.js", "PostgreSQL", "Tailwind CSS", "Supabase"],
    },
    {
      title: "CodeCollab",
      description:
        "Real-time collaborative code editor supporting 5 languages with WebSocket diff sync.",
      tech_used: ["React", "Node.js", "Socket.io", "Monaco Editor"],
    },
  ],
};

// ─── Skill Gaps ──────────────────────────────────────────────────────────────
export const mockSkillGaps: SkillGap[] = [
  {
    skill: "System Design",
    severity: "high",
    why_it_matters:
      "Senior full-stack roles require designing scalable distributed systems. Missing this blocks L5+ interviews.",
    readiness_component_score: 22,
  },
  {
    skill: "AWS / Cloud Architecture",
    severity: "high",
    why_it_matters:
      "Most production deployments are cloud-native. Cloud skills appear in 78% of full-stack JDs.",
    readiness_component_score: 30,
  },
  {
    skill: "Docker & Kubernetes",
    severity: "medium",
    why_it_matters:
      "Container orchestration is standard for CI/CD pipelines in mid-to-large engineering teams.",
    readiness_component_score: 41,
  },
  {
    skill: "GraphQL",
    severity: "medium",
    why_it_matters:
      "GraphQL is adopted by companies like GitHub, Shopify, and Twitter as an API standard.",
    readiness_component_score: 50,
  },
  {
    skill: "Testing (Jest / Cypress)",
    severity: "low",
    why_it_matters:
      "Test coverage signals engineering maturity. Most companies require >80% unit test coverage.",
    readiness_component_score: 60,
  },
];

// ─── Roadmap Tasks ────────────────────────────────────────────────────────────
export const mockRoadmapTasks: RoadmapTask[] = [
  {
    id: "task_01",
    title: "Master System Design Fundamentals",
    description:
      "Study CAP theorem, consistent hashing, load balancing, and database sharding. Complete Grokking the System Design Interview.",
    priority: "high",
    estimated_hours: 20,
    prerequisites: [],
    status: "in_progress",
    week_number: 1,
  },
  {
    id: "task_02",
    title: "AWS Core Services Certification Prep",
    description:
      "Cover EC2, S3, RDS, Lambda, and CloudFront. Target AWS Cloud Practitioner as a stepping stone.",
    priority: "high",
    estimated_hours: 15,
    prerequisites: [],
    status: "pending",
    week_number: 1,
  },
  {
    id: "task_03",
    title: "Build a Distributed URL Shortener",
    description:
      "Implement a production-grade URL shortener using Redis, PostgreSQL, and Node.js to practice system design concepts hands-on.",
    priority: "high",
    estimated_hours: 12,
    prerequisites: ["task_01"],
    status: "pending",
    week_number: 2,
  },
  {
    id: "task_04",
    title: "Docker Fundamentals + Compose",
    description:
      "Containerize existing projects. Set up multi-service docker-compose with Postgres, Redis, and Node services.",
    priority: "medium",
    estimated_hours: 8,
    prerequisites: [],
    status: "pending",
    week_number: 2,
  },
  {
    id: "task_05",
    title: "GraphQL API with Apollo Server",
    description:
      "Refactor one REST API to GraphQL. Implement queries, mutations, subscriptions, and DataLoader for N+1 prevention.",
    priority: "medium",
    estimated_hours: 10,
    prerequisites: ["task_04"],
    status: "pending",
    week_number: 3,
  },
  {
    id: "task_06",
    title: "Jest Unit + Integration Tests",
    description:
      "Write comprehensive tests for the URL shortener project achieving >85% coverage. Add Cypress E2E for frontend flows.",
    priority: "low",
    estimated_hours: 8,
    prerequisites: ["task_03"],
    status: "pending",
    week_number: 3,
  },
  {
    id: "task_07",
    title: "Kubernetes Basics (Minikube)",
    description:
      "Deploy the URL shortener to a local k8s cluster. Learn Deployments, Services, ConfigMaps, and HPA.",
    priority: "medium",
    estimated_hours: 12,
    prerequisites: ["task_04"],
    status: "pending",
    week_number: 4,
  },
  {
    id: "task_08",
    title: "Mock System Design Interviews",
    description:
      "Complete 4 mock system design sessions (Pramp / peers). Focus on communication clarity and trade-off justification.",
    priority: "high",
    estimated_hours: 8,
    prerequisites: ["task_01", "task_03"],
    status: "pending",
    week_number: 4,
  },
];

// ─── Recommendations ──────────────────────────────────────────────────────────
export const mockRecommendations: Recommendation[] = [
  {
    type: "course",
    title: "Grokking the System Design Interview",
    description:
      "Industry-standard system design course covering 20+ real interview questions from FAANG companies.",
    reason:
      "System Design is your highest-severity gap. This course is referenced in 90% of successful senior-engineer interview prep plans.",
    difficulty: "Intermediate",
    estimated_duration: "40 hours",
    expected_outcome:
      "Confidently design scalable systems in 45-minute interview sessions.",
  },
  {
    type: "certification",
    title: "AWS Certified Cloud Practitioner",
    description:
      "AWS foundational certification covering core services, pricing, and cloud concepts.",
    reason:
      "Cloud architecture is critical for full-stack roles. This cert validates fundamentals and is a prerequisite for Solutions Architect.",
    difficulty: "Beginner",
    estimated_duration: "20 hours",
    expected_outcome: "AWS certification badge + cloud credibility on resume.",
  },
  {
    type: "project",
    title: "Build a Real-Time Chat App with WebSockets + Redis Pub/Sub",
    description:
      "Construct a scalable chat backend demonstrating distributed messaging, session management, and horizontal scaling.",
    reason:
      "Project-based learning accelerates System Design comprehension. Demonstrates Docker, Redis, and Node.js in a deployable product.",
    difficulty: "Intermediate",
    estimated_duration: "15 hours",
    expected_outcome: "GitHub project + live demo link for portfolio.",
  },
  {
    type: "course",
    title: "Docker & Kubernetes: The Complete Guide",
    description:
      "Comprehensive course from Docker basics to Kubernetes production deployments on AWS EKS.",
    reason:
      "Container orchestration appears in 60% of full-stack JDs. Directly closes your Docker/K8s skill gap.",
    difficulty: "Intermediate",
    estimated_duration: "30 hours",
    expected_outcome:
      "Containerize and orchestrate any full-stack app independently.",
  },
  {
    type: "course",
    title: "Full-Stack GraphQL with Apollo",
    description:
      "Learn schema-first GraphQL design, Apollo Server/Client, subscriptions, and authentication patterns.",
    reason:
      "GraphQL is your medium-severity gap and is valued at companies like Airbnb, Twitter, and GitHub.",
    difficulty: "Intermediate",
    estimated_duration: "18 hours",
    expected_outcome: "Replace REST APIs with GraphQL in any Node.js project.",
  },
  {
    type: "interview_resource",
    title: "LeetCode Blind 75 — Structured Plan",
    description:
      "Curated 75 LeetCode problems covering arrays, trees, graphs, and dynamic programming.",
    reason:
      "Coding interviews at top companies require consistent DSA practice. Blind 75 is the industry-consensus minimum prep set.",
    difficulty: "Mixed",
    estimated_duration: "40 hours",
    expected_outcome: "Solve medium-difficulty DSA problems within 20 minutes.",
  },
];

// ─── Interview Questions ──────────────────────────────────────────────────────
export const mockInterviewQuestions: InterviewQuestion[] = [
  {
    question: "Design a URL shortening service like bit.ly. Walk me through your architecture.",
    type: "technical",
    difficulty: "hard",
    model_answer:
      "Start with requirements: 100M URLs/day write, 10B reads/day. Use a base-62 encoding (7 chars) to generate short codes. Architecture: API Gateway → App Servers → Redis cache (hot URLs) → PostgreSQL (source of truth). For scale, add consistent hashing across DB shards, CDN for redirects, and async analytics via Kafka. Discuss trade-offs: UUID vs counter-based IDs, cache eviction (LRU), and rate limiting.",
    follow_up:
      "How would you handle custom aliases and what happens if two users pick the same alias simultaneously?",
  },
  {
    question: "Explain the difference between `useEffect` and `useLayoutEffect` in React.",
    type: "technical",
    difficulty: "medium",
    model_answer:
      "`useEffect` runs asynchronously after the browser paints — safe for data fetching, subscriptions. `useLayoutEffect` runs synchronously before paint — needed when DOM measurements (getBoundingClientRect) must happen before the user sees the screen to avoid flicker. Overusing useLayoutEffect can block rendering, so prefer useEffect by default.",
    follow_up: "When would you choose useLayoutEffect over useEffect in a tooltip positioning system?",
  },
  {
    question: "What is the N+1 query problem and how do you solve it in GraphQL?",
    type: "technical",
    difficulty: "medium",
    model_answer:
      "N+1 occurs when fetching a list of N items each triggers an additional DB query for related data (e.g., fetching 100 posts then 100 author queries). In GraphQL, solve it with DataLoader: it batches all field-resolver calls within a single tick into one SQL IN clause, then distributes results back to individual resolvers. Result: 1 posts query + 1 batched authors query instead of 101 queries.",
    follow_up: "How does DataLoader handle caching within a request lifecycle?",
  },
  {
    question: "Where do you see yourself in 5 years, and how does this role fit into that vision?",
    type: "hr",
    difficulty: "easy",
    model_answer:
      "In 5 years, I see myself leading a small engineering team, driving architecture decisions for a product used at scale. This role aligns because it exposes me to distributed systems challenges early, and the mentorship culture here accelerates my growth toward technical leadership. I'm particularly drawn to the ownership model — I thrive when I can take a feature from design to production.",
    follow_up: "What specific technical skill do you plan to develop most in the first year?",
  },
  {
    question: "Explain event loop, call stack, and task queue in JavaScript.",
    type: "technical",
    difficulty: "medium",
    model_answer:
      "The call stack is LIFO — synchronous code runs here. The event loop continuously checks: if the call stack is empty, it takes the first callback from the task queue (macrotasks: setTimeout, I/O) or microtask queue (Promises, queueMicrotask) and pushes it to the stack. Microtasks are drained completely before each macrotask. This explains why `Promise.resolve().then(...)` runs before `setTimeout(..., 0)`.",
    follow_up: "What is the difference between microtasks and macrotasks? Give two examples of each.",
  },
  {
    question: "Tell me about a time you disagreed with a technical decision. How did you handle it?",
    type: "hr",
    difficulty: "medium",
    model_answer:
      "During an internship, the team planned to introduce a custom state management library instead of Redux Toolkit. I researched both, documented trade-offs in a one-pager, and proposed RTK citing its dev-tools, ecosystem, and lower maintenance burden. I presented the case in a team meeting with concrete migration estimates. The team adopted RTK. The key was focusing on data and team benefit rather than personal preference, and being open to being wrong.",
    follow_up: "What would you have done if the team still chose the custom library?",
  },
];

// ─── Progress Summary ────────────────────────────────────────────────────────
export const mockProgressSummary: ProgressSummary = {
  readiness_score: 62,
  breakdown: {
    "Technical Skills":   72,
    "System Design":      22,
    "Cloud/DevOps":       30,
    "Projects Portfolio": 75,
    "Interview Readiness":45,
  },
  roadmap_progress_pct: 12.5, // 1/8 tasks done
};

// ─── Mentor conversation seed ─────────────────────────────────────────────────
export const mockMentorHistory: MentorMessage[] = [
  {
    role: "assistant",
    content:
      "Hi Alex! I'm your AI Career Mentor 👋 I've reviewed your profile and skill gaps. I notice System Design is your biggest area to develop for a Full-Stack Engineer role. Where would you like to start today — concept deep-dives, mock interviews, or resource recommendations?",
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
];
