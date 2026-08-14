"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LandingUserBar() {
  const [name, setName]   = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email ?? null);
        setName(
          session.user.user_metadata?.full_name ||
          session.user.email?.split("@")[0] ||
          null
        );
      }
    });
  }, []);

  if (!name) return null;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
      <div className="glass-card flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/20 border border-brand-500/30">
            <User size={16} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">{name}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-primary py-1.5 px-4 text-sm">
            Go to Dashboard
          </Link>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            className="btn-ghost py-1.5 px-3 text-sm gap-1.5"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
