import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SkillForge AI — Personalized Learning & Career Mentor",
    template: "%s | SkillForge AI",
  },
  description:
    "Upload your resume, discover your skill gaps, get a personalized learning roadmap, and chat with an AI career mentor — all in one platform.",
  keywords: ["skill gap analysis", "career mentor", "learning roadmap", "AI career", "resume analysis"],
  openGraph: {
    title: "SkillForge AI",
    description: "Your AI-powered career development platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-surface antialiased">
        {children}
      </body>
    </html>
  );
}
