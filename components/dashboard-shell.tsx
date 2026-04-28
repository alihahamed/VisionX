import Link from "next/link";

import type { AnalysisResult, ContributorProfile, DecisionMoment } from "@/lib/types";

export function DashboardShell({ data }: { data: AnalysisResult }) {
  const topContributor = data.contributors[0];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/7 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Master dashboard</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">{data.project.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{data.project.repo_url}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Commits" value={String(data.project.commit_count)} />
            <Stat label="Contributors" value={String(data.project.contributors_count)} />
          </div>
        </div>
      </section>

      {data.warnings.length ? (
        <section className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
          {data.warnings.join(" ")}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <TimelinePanel decisions={data.decisions} jobId={data.job_id} />
        <GraphPanel graph={data.graph} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.contributors.map((contributor) => (
          <ContributorCard key={contributor.contributor_id} jobId={data.job_id} contributor={contributor} />
        ))}
      </section>

      {topContributor ? (
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Best read</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Top contributor narrative</h2>
          <p className="mt-3 leading-7">{topContributor.narrative}</p>
        </section>
      ) : null}
    </div>
  );
}

function TimelinePanel({ decisions, jobId }: { decisions: DecisionMoment[]; jobId: string }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Timeline</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Decision moments</h2>
        </div>
        {decisions[0] ? (
          <Link
            href={`/contributors/${jobId}/${decisions[0].contributor_id}`}
            className="text-sm text-amber-200"
          >
            Open profile
          </Link>
        ) : null}
      </div>
      <div className="mt-5 space-y-3">
        {decisions.length ? (
          decisions.map((decision, index) => (
            <article
              key={decision.decision_id}
              className="rounded-2xl border border-white/8 bg-black/15 p-4 transition hover:border-amber-300/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    {index + 1}. {decision.title}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{decision.type}</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                  {(decision.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{decision.summary}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-400">No decisions extracted yet.</p>
        )}
      </div>
    </section>
  );
}

function GraphPanel({ graph }: { graph: AnalysisResult["graph"] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">Influence</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Graph summary</h2>
      <div className="mt-5 grid gap-3">
        {graph.nodes.slice(0, 6).map((node) => (
          <div key={node.id} className="rounded-2xl border border-white/8 bg-black/15 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">{node.label}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">{node.kind}</p>
              </div>
              <span className="font-mono text-sm text-amber-200">{node.influence_score.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Full interactive graph can be added next. This summary keeps the initial integration light and stable.
      </p>
    </section>
  );
}

function ContributorCard({
  contributor,
  jobId,
}: {
  contributor: ContributorProfile;
  jobId: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">{contributor.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{contributor.role}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
          {(contributor.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{contributor.narrative}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {contributor.top_decisions.map((decision) => (
          <span key={decision} className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {decision}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href={`/contributors/${jobId}/${contributor.contributor_id}`} className="text-amber-200">
          View profile
        </Link>
        <span className="text-slate-500">{contributor.evidence.length} citations</span>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
