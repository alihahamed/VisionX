import Link from "next/link";

import { AnalyzingTracker } from "@/components/analyzing-tracker";

export default function AnalyzingPage({
  params,
}: {
  params: { jobId: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Analyzing</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Mining project history</h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10"
        >
          New repo
        </Link>
      </div>
      <AnalyzingTracker jobId={params.jobId} />
    </main>
  );
}
