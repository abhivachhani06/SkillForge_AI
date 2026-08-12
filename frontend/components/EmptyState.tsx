"use client";

import { FileQuestion, UploadCloud, BookOpen, MessageCircle } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  cta?: { label: string; href: string };
  icon?: "upload" | "book" | "chat" | "question";
}

const iconMap = {
  upload:   UploadCloud,
  book:     BookOpen,
  chat:     MessageCircle,
  question: FileQuestion,
};

export default function EmptyState({
  title,
  description,
  cta,
  icon = "question",
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/20">
        <Icon size={36} className="text-brand-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mb-8 max-w-sm text-slate-400">{description}</p>
      {cta && (
        <Link href={cta.href} className="btn-primary">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
