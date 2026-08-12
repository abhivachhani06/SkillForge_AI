"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import {
  Zap, LayoutDashboard, Map, Lightbulb,
  MessageSquare, BrainCircuit, LogOut, Menu, X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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
  const [menuOpen, setMenuOpen] = useState(false);

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

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-surface-muted hover:text-slate-200 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={16} />
            Sign out
          </button>

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
