import Link from "next/link";
import { notFound } from "next/navigation";

import { getAnalysisResult } from "@/lib/api";

export default async function ContributorPage({
  params,
}: {
  params: { jobId: string; contributorId: string };
}) {
  const result = await getAnalysisResult(params.jobId).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unable to load contributor profile.";
    return { error: message };
  });

  if ("error" in result) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-8">
        <section className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-8 text-rose-50">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-100/70">Contributor unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Profile could not load</h1>
          <p className="mt-4 leading-7 text-rose-50/80">{result.error}</p>
        </section>
      </main>
    );
  }

  const contributor = result.contributors.find((item) => item.contributor_id === params.contributorId);
  if (!contributor) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Contributor</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{contributor.name}</h1>
        </div>
        <Link
          href={`/dashboard/${params.jobId}`}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10"
        >
          Back to dashboard
        </Link>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-1 text-sm text-amber-100">
            {contributor.role}
          </span>
          <span className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
            {(contributor.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>

        <p className="mt-6 text-lg leading-8 text-slate-200">{contributor.narrative}</p>

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">Top decisions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {contributor.top_decisions.map((decision) => (
              <span
                key={decision}
                className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-slate-200"
              >
                {decision}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">Evidence</h2>
          <div className="mt-4 space-y-3">
            {contributor.evidence.map((item) => (
              <article
                key={`${item.commit_sha}-${item.reason}`}
                className="rounded-2xl border border-white/8 bg-black/15 p-4"
              >
                <p className="font-mono text-sm text-amber-200">{item.commit_sha}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.reason}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
