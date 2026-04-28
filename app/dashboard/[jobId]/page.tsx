import Link from "next/link";

import { DashboardShell } from "@/components/dashboard-shell";
import { getAnalysisResult } from "@/lib/api";

export default async function DashboardPage({
  params,
}: {
  params: { jobId: string };
}) {
  const result = await getAnalysisResult(params.jobId).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Failed to load dashboard.";
    return { error: message };
  });

  if ("error" in result) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-8">
        <section className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-8 text-rose-50">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-100/70">Dashboard unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Result not ready yet</h1>
          <p className="mt-4 leading-7 text-rose-50/80">{result.error}</p>
          <Link
            href={`/analyzing/${params.jobId}`}
            className="mt-6 inline-flex rounded-full bg-rose-200 px-4 py-2 text-sm font-semibold text-rose-950"
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
      <DashboardShell data={result} />
    </main>
  );
}
