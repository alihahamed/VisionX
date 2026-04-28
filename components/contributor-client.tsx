"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAnalysisResult } from "@/lib/api";
import type { ContributorProfile } from "@/lib/types";

export function ContributorClient({
  jobId,
  contributorId,
}: {
  jobId: string;
  contributorId: string;
}) {
  const [contributor, setContributor] = useState<ContributorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const result = await getAnalysisResult(jobId);
        if (!mounted) {
          return;
        }
        const item = result.contributors.find((x) => x.contributor_id === contributorId);
        if (!item) {
          setError("Contributor not found in result.");
          return;
        }
        setContributor(item);
        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load contributor profile.");
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [jobId, contributorId]);

  if (!contributor) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-8">
        <section className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-8 text-rose-50">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-100/70">Contributor unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Profile could not load</h1>
          <p className="mt-4 leading-7 text-rose-50/80">{error ?? "Loading..."}</p>
          <Link
            href={`/dashboard/${jobId}`}
            className="mt-6 inline-flex rounded-full bg-rose-200 px-4 py-2 text-sm font-semibold text-rose-950"
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Contributor</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{contributor.name}</h1>
        </div>
        <Link
          href={`/dashboard/${jobId}`}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10"
        >
          Back to dashboard
        </Link>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-1 text-sm text-amber-100">
            {contributor.role}
          </span>
          <span className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
            {(contributor.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
        <p className="mt-6 text-lg leading-8 text-slate-200">{contributor.narrative}</p>
      </section>
    </main>
  );
}
