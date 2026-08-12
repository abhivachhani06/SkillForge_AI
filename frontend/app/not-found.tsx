import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface text-center px-4">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/20">
        <FileQuestion size={36} className="text-brand-400" />
      </div>
      <h1 className="font-display text-5xl font-bold text-white mb-2">404</h1>
      <p className="text-xl text-slate-300 mb-2">Page not found</p>
      <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link href="/" className="btn-primary">
        Go to homepage
      </Link>
    </div>
  );
}
