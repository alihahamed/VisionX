"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/dashboard-shell";
import { getAnalysisResult } from "@/lib/api";
import type { AnalysisResult } from "@/lib/types";

export function DashboardClient({ jobId }: { jobId: string }) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    async function load() {
      try {
        const result = await getAnalysisResult(jobId);
        if (!mounted) {
          return;
        }
        setData(result);
        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to load dashboard.";
        setError(message);
        if (message.toLowerCase().includes("not ready")) {
          timer = window.setTimeout(load, 800);
        }
      }
    }

    load();

    return () => {
      mounted = false;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [jobId]);

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-8 text-slate-200">
          <p className="text-xs uppercase tracking-[0.3em] text-white/55">Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Loading analysis result</h1>
          <p className="mt-4 leading-7 text-slate-300">
            {error ?? "Waiting for result payload..."}
          </p>
          <Link
            href={`/analyzing/${jobId}`}
            className="mt-6 inline-flex rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Back to analyzing
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Contribution map</h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10"
        >
          New repo
        </Link>
      </div>
      <DashboardShell data={data} />
    </main>
  );
}
