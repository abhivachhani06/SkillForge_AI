"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import {
  Zap, LayoutDashboard, Map, Lightbulb,
  MessageSquare, BrainCircuit, LogOut, Menu, X, User, ChevronDown, Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getStudentProfile } from "@/lib/api";
import type { StudentProfile } from "@/lib/types";

const navLinks = [
  { href: "/dashboard",       label: "Dashboard",    icon: LayoutDashboard },
  { href: "/roadmap",         label: "Roadmap",      icon: Map },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/interview-prep",  label: "Interview Prep", icon: BrainCircuit },
  { href: "/mentor",          label: "AI Mentor",    icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [student, setStudent]         = useState<StudentProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getStudentProfile().then(setStudent).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = student?.name
    ? student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-display font-bold text-lg text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600">
            <Zap size={16} className="text-white" />
          </div>
          SkillForge<span className="text-brand-400"> AI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-brand-500/15 text-brand-300"
                  : "text-slate-400 hover:bg-surface-muted hover:text-slate-200"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Profile dropdown */}
          {student && (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-300 hover:bg-surface-muted transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/25 border border-brand-500/40 text-brand-300 text-xs font-bold">
                  {initials}
                </div>
                <span className="font-medium">{student.name.split(" ")[0]}</span>
                <ChevronDown size={14} className={clsx("transition-transform", profileOpen && "rotate-180")} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-surface-border bg-surface-card shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-surface-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 font-bold">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">{student.name}</p>
                        <p className="text-xs text-slate-500 truncate">{student.email}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Target Role</span>
                      <span className="text-brand-300 font-medium truncate max-w-[140px]">{student.target_role}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Level</span>
                      <span className="capitalize text-purple-300">{student.experience_level}</span>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-surface-muted transition-colors"
                    >
                      <User size={14} />
                      View Full Profile
                    </Link>
                    <Link
                      href="/resume-upload"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-surface-muted transition-colors"
                    >
                      <Upload size={14} />
                      Update Resume
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sign out (fallback when no student) */}
          {!student && (
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-surface-muted hover:text-slate-200 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-surface-muted"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-surface-border bg-surface-card px-4 pb-4">
          <nav className="mt-2 space-y-1" aria-label="Mobile navigation">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-brand-500/15 text-brand-300"
                    : "text-slate-400 hover:bg-surface-muted hover:text-slate-200"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-surface-muted"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
