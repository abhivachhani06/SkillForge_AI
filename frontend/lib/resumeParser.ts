import type { CareerProfile } from "./types";

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = await Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) =>
        pdf.getPage(i + 1).then((p) => p.getTextContent()).then((c) =>
          c.items.map((item: any) => item.str).join(" ")
        )
      )
    );
    return pages.join("\n");
  }
  return file.text();
}

const KNOWN_SKILLS = [
  "JavaScript","TypeScript","React","React.js","Next.js","Node.js","Express","Express.js",
  "Python","Django","Flask","Java","C","C++","Dart","Flutter","Kotlin","Swift",
  "HTML","CSS","Tailwind","Tailwind CSS","Bootstrap","SASS",
  "PostgreSQL","MySQL","MongoDB","Supabase","Firebase","Redis","Prisma","SQLite",
  "Docker","Kubernetes","AWS","GCP","Azure","Linux","Git","GitHub","CI/CD",
  "GraphQL","REST","REST APIs","WebSockets","Socket.io","JWT","OAuth",
  "Razorpay","Stripe","Nodemailer","Vite","Webpack","Redux","Vue","Angular",
  "Machine Learning","TensorFlow","PyTorch","Pandas","NumPy","Scikit-learn",
  "System Design","Microservices","DevOps","Agile","Scrum",
];

function extractSkills(text: string): string[] {
  const upper = text;
  return KNOWN_SKILLS.filter((s) =>
    new RegExp(`\\b${s.replace(/[.+]/g, "\\$&")}\\b`, "i").test(upper)
  );
}

function extractName(text: string): string {
  // First non-empty line is usually the name
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const first = lines[0] ?? "";
  // If it looks like a name (no special chars, 2-4 words)
  if (/^[A-Za-z ]{3,50}$/.test(first) && first.split(" ").length <= 4) return first;
  return "Candidate";
}

function extractSection(text: string, headings: string[]): string {
  for (const h of headings) {
    const re = new RegExp(`${h}[:\\s]*([\\s\\S]*?)(?=\\n[A-Z][A-Z ]{3,}|$)`, "i");
    const m = text.match(re);
    if (m) return m[1].trim().slice(0, 400);
  }
  return "";
}

function extractExperience(text: string) {
  const section = extractSection(text, ["EXPERIENCE","INTERNSHIP","INTERNSHIPS","WORK EXPERIENCE"]);
  if (!section) return [];
  const lines = section.split("\n").filter(Boolean);
  const results: CareerProfile["experience"] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Look for lines with a dash or @ or "at" pattern
    const match = line.match(/^[-•]?\s*(.+?)\s*[(@]\s*(.+?)\s*[):]?\s*[\[(]?(\d{4}.*?\d{4}|\d+ [Dd]ays?)?/);
    if (match) {
      results.push({
        role: match[1]?.trim() ?? line,
        company: match[2]?.trim() ?? "",
        duration: match[3]?.trim() ?? "",
        description: lines[i + 1]?.trim() ?? "",
      });
    }
  }
  return results.slice(0, 3);
}

function extractProjects(text: string) {
  const section = extractSection(text, ["PROJECTS","PROJECT"]);
  if (!section) return [];
  const blocks = section.split(/\n\s*\n/).filter(Boolean);
  return blocks.slice(0, 4).map((block) => {
    const lines = block.split("\n").filter(Boolean);
    const title = lines[0]?.replace(/^\d+\.\s*/, "").split("(")[0].trim() ?? "Project";
    const techLine = lines.find((l) => /tech[: ]/i.test(l)) ?? "";
    const tech = techLine
      ? techLine.replace(/tech[: ]*/i, "").split(/[,/]/).map((t) => t.trim()).filter(Boolean)
      : extractSkills(block);
    return {
      title,
      description: lines.slice(1).join(" ").slice(0, 200),
      tech_used: tech.slice(0, 6),
    };
  });
}

function extractEducation(text: string) {
  const section = extractSection(text, ["EDUCATION","ACADEMIC"]);
  if (!section) return [];
  const lines = section.split("\n").filter(Boolean);
  return lines.slice(0, 3).map((line) => {
    const yearMatch = line.match(/\b(20\d{2})\b/);
    return {
      degree: line.split("-")[0]?.trim() ?? line,
      institution: line.split("-")[1]?.trim() ?? "",
      year: yearMatch?.[1] ?? "",
    };
  });
}

export async function parseResumeFile(file: File): Promise<CareerProfile> {
  const text = await extractTextFromFile(file);
  const name = extractName(text);
  const skills = extractSkills(text);
  const experience = extractExperience(text);
  const projects = extractProjects(text);
  const education = extractEducation(text);

  return {
    summary: `${name} — extracted from uploaded resume. Skills: ${skills.slice(0, 6).join(", ")}.`,
    skills: skills.length > 0 ? skills : ["JavaScript", "HTML", "CSS"],
    education,
    experience,
    projects,
  };
}
