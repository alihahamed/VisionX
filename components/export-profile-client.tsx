"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useAnalysisResultQuery } from "@/lib/queries";
import type { ContributorProfile } from "@/lib/types";

export function ExportProfileClient({
  jobId,
  contributorId,
}: {
  jobId: string;
  contributorId: string;
}) {
  const resultQuery = useAnalysisResultQuery(jobId);
  const contributor = useMemo<ContributorProfile | null>(() => {
    if (!resultQuery.data) {
      return null;
    }
    return resultQuery.data.contributors.find((x) => x.contributor_id === contributorId) ?? null;
  }, [resultQuery.data, contributorId]);

  if (!contributor || !resultQuery.data) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-8">
        <section className="w-full rounded-3xl border border-rose-400/20 bg-rose-500/10 p-8 text-rose-50">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-100/70">Export unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Contributor profile missing</h1>
          <Link href={`/dashboard/${jobId}`} className="mt-5 inline-flex text-sm text-rose-100 underline">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
      <section className="rounded-3xl border border-white/12 bg-slate-950 p-8 text-slate-100 print:border-slate-300 print:bg-white print:text-slate-900">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70 print:text-slate-500">Proof of Thinking</p>
        <h1 className="mt-2 text-3xl font-semibold">{contributor.name}</h1>
        <p className="mt-2 text-sm text-slate-300 print:text-slate-600">{resultQuery.data.project.name}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-white/20 px-3 py-1 print:border-slate-300">{contributor.role}</span>
          <span className="rounded-full border border-white/20 px-3 py-1 print:border-slate-300">
            {(contributor.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>

        <p className="mt-6 leading-7 text-slate-200 print:text-slate-700">{contributor.narrative}</p>

        <h2 className="mt-8 text-lg font-semibold">Top decisions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {contributor.top_decisions.map((decision) => (
            <span key={decision} className="rounded-full border border-white/20 px-3 py-1 text-sm print:border-slate-300">
              {decision}
            </span>
          ))}
        </div>

        <h2 className="mt-8 text-lg font-semibold">Evidence citations</h2>
        <div className="mt-3 space-y-2">
          {contributor.evidence.map((evidence, index) => (
            <article key={`${evidence.commit_sha}-${index}`} className="rounded-xl border border-white/12 p-3 text-sm print:border-slate-300">
              <p className="font-mono text-amber-200 print:text-slate-900">{evidence.commit_sha}</p>
              <p className="mt-1 text-slate-300 print:text-slate-700">{evidence.reason}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex gap-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Print / Save PDF
          </button>
          <Link href={`/contributors/${jobId}/${contributorId}`} className="rounded-xl border border-white/20 px-4 py-2 text-sm">
            Back
          </Link>
        </div>
      </section>
    </main>
  );
}
