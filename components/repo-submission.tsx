"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createAnalysis } from "@/lib/api";

export function RepoSubmission() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("https://github.com/alihahamed/VisionX");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const job = await createAnalysis(repoUrl.trim());
      router.push(`/analyzing/${job.job_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/12 bg-white/8 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="space-y-2">
        <label htmlFor="repo-url" className="text-sm font-medium text-white/70">
          Public GitHub repository URL
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            id="repo-url"
            type="url"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/org/repo"
            className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 text-white outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/25"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-2xl bg-amber-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Analyzing..." : "Analyze repo"}
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
        <span className="rounded-full border border-white/10 px-3 py-1">No OAuth</span>
        <span className="rounded-full border border-white/10 px-3 py-1">GitHub URL only</span>
        <span className="rounded-full border border-white/10 px-3 py-1">Live FastAPI backend</span>
      </div>
      {error ? (
        <p className="mt-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
    </form>
  );
}
