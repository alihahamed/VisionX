"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import type {
  AnalysisSummary,
  ContributorProfile,
  DecisionMoment,
  GraphPayload,
} from "@/lib/types";

const GraphCanvas = dynamic(
  () => import("@/components/graph-canvas").then((m) => m.GraphCanvas),
  { ssr: false },
);
const EMPTY_DECISIONS: DecisionMoment[] = [];
const EMPTY_GRAPH: GraphPayload = { nodes: [], edges: [] };
const EMPTY_CONTRIBUTORS: ContributorProfile[] = [];

export function DashboardShell({
  summary,
  timeline,
  graph,
  contributors,
}: {
  summary: AnalysisSummary;
  timeline?: DecisionMoment[];
  graph?: GraphPayload;
  contributors?: ContributorProfile[];
}) {
  const decisions = timeline ?? EMPTY_DECISIONS;
  const graphData = graph ?? EMPTY_GRAPH;
  const contributorData = contributors ?? EMPTY_CONTRIBUTORS;
  const topContributor = contributorData[0];
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const selectedDecision = useMemo(
    () => decisions.find((decision) => decision.decision_id === selectedDecisionId) ?? null,
    [decisions, selectedDecisionId],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/7 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Master dashboard</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">{summary.project.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{summary.project.repo_url}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Commits" value={String(summary.project.commit_count)} />
            <Stat label="Contributors" value={String(summary.project.contributors_count)} />
          </div>
        </div>
      </section>

      {summary.warnings.length ? (
        <section className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
          {summary.warnings.join(" ")}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <TimelinePanel
          decisions={decisions}
          jobId={summary.job_id}
          onSelectDecision={(decisionId) => setSelectedDecisionId(decisionId)}
        />
        <GraphPanel graph={graphData} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {contributorData.map((contributor) => (
          <ContributorCard key={contributor.contributor_id} jobId={summary.job_id} contributor={contributor} />
        ))}
      </section>

      {topContributor ? (
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Best read</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Top contributor narrative</h2>
          <p className="mt-3 leading-7">{topContributor.narrative}</p>
          <Link
            href={`/export/${summary.job_id}/${topContributor.contributor_id}`}
            className="mt-4 inline-flex text-amber-200 hover:text-amber-100"
          >
            Open export profile
          </Link>
        </section>
      ) : null}

      <EvidenceDrawer decision={selectedDecision} onClose={() => setSelectedDecisionId(null)} />
    </div>
  );
}

function TimelinePanel({
  decisions,
  jobId,
  onSelectDecision,
}: {
  decisions: DecisionMoment[];
  jobId: string;
  onSelectDecision: (decisionId: string) => void;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Timeline</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Decision moments</h2>
        </div>
        {decisions[0] ? (
          <Link href={`/contributors/${jobId}/${decisions[0].contributor_id}`} className="text-sm text-amber-200">
            Open profile
          </Link>
        ) : null}
      </div>
      <div className="mt-5 space-y-3">
        {decisions.length ? (
          decisions.map((decision, index) => (
            <button
              key={decision.decision_id}
              type="button"
              onClick={() => onSelectDecision(decision.decision_id)}
              className="w-full rounded-2xl border border-white/8 bg-black/15 p-4 text-left transition hover:border-amber-300/20"
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
            </button>
          ))
        ) : (
          <p className="text-sm text-slate-400">No decisions extracted yet.</p>
        )}
      </div>
    </section>
  );
}

function GraphPanel({ graph }: { graph: GraphPayload }) {
  const [showFullGraph, setShowFullGraph] = useState(false);
  const limited = useMemo(() => {
    if (showFullGraph) {
      return graph;
    }
    const sortedEdges = [...graph.edges].sort((a, b) => b.weight - a.weight).slice(0, 80);
    const nodeIds = new Set<string>();
    for (const edge of sortedEdges) {
      nodeIds.add(edge.source);
      nodeIds.add(edge.target);
    }
    const nodes = graph.nodes.filter((node) => nodeIds.has(node.id)).slice(0, 120);
    return { nodes, edges: sortedEdges };
  }, [graph, showFullGraph]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">Influence</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Graph</h2>
      {!showFullGraph && graph.edges.length > 80 ? (
        <button
          type="button"
          onClick={() => setShowFullGraph(true)}
          className="mt-3 rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200"
        >
          Load full graph ({graph.nodes.length} nodes / {graph.edges.length} edges)
        </button>
      ) : null}
      <div className="mt-5 h-[440px] rounded-2xl border border-white/10 bg-slate-950/70 p-2">
        <GraphCanvas graph={limited} />
      </div>
    </section>
  );
}

function EvidenceDrawer({
  decision,
  onClose,
}: {
  decision: DecisionMoment | null;
  onClose: () => void;
}) {
  if (!decision) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 lg:items-center">
      <section className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-3xl border border-white/12 bg-slate-950 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Evidence</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{decision.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80"
          >
            Close
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-300">{decision.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-emerald-50">
            {(decision.confidence * 100).toFixed(0)}% confidence
          </span>
          <span className="rounded-full border border-white/20 px-3 py-1 text-slate-200">{decision.type}</span>
        </div>
        <div className="mt-6 space-y-3">
          {decision.evidence.map((item) => (
            <article key={`${decision.decision_id}-${item.commit_sha}`} className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <p className="font-mono text-sm text-amber-200">{item.commit_sha}</p>
              <p className="mt-2 text-sm text-slate-200">{item.reason}</p>
              {item.file_paths?.length ? (
                <p className="mt-2 text-xs text-slate-400">Files: {item.file_paths.join(", ")}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
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
        <Link href={`/export/${jobId}/${contributor.contributor_id}`} className="text-slate-300 hover:text-white">
          Export
        </Link>
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
