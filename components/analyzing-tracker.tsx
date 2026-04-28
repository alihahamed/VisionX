"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAnalysisJob } from "@/lib/api";
import type { AnalysisJob, JobStatus } from "@/lib/types";

const STEPS: Array<{ key: NonNullable<AnalysisJob["progress_stage"]>; label: string }> = [
  { key: "ingest", label: "Cloning repository" },
  { key: "classify", label: "Classifying commits" },
  { key: "detect", label: "Detecting decision moments" },
  { key: "graph", label: "Mapping influence graph" },
  { key: "narrate", label: "Generating narratives" },
];

export function AnalyzingTracker({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const latest = await getAnalysisJob(jobId);
        if (cancelled) {
          return;
        }
        setJob(latest);

        if (latest.status === "done") {
          router.replace(`/dashboard/${jobId}`);
          return;
        }

        if (latest.status === "failed" || latest.status === "timeout" || latest.status === "invalid_repo") {
          setError(formatStatusMessage(latest.status));
          return;
        }

        timer = window.setTimeout(poll, 1200);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to poll analysis status.");
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [jobId, router]);

  const activeStep = job?.progress_stage ?? "ingest";
  const status = job?.status ?? "queued";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">Analyzing</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Project history in motion</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Job <span className="font-mono text-white">{jobId}</span> is running through the backend pipeline.
          Keep this page open. It will redirect to the dashboard when analysis is done.
        </p>

        <div className="mt-8 space-y-3">
          {STEPS.map((step) => {
            const isActive = activeStep === step.key;
            const isComplete = STEPS.findIndex((item) => item.key === step.key) < STEPS.findIndex((item) => item.key === activeStep);

            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                  isActive
                    ? "border-amber-300/50 bg-amber-300/10"
                    : isComplete
                      ? "border-emerald-400/20 bg-emerald-400/8"
                      : "border-white/8 bg-black/15"
                }`}
              >
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isActive ? "bg-amber-300" : isComplete ? "bg-emerald-300" : "bg-white/20"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-white">{step.label}</p>
                  <p className="text-xs text-slate-400">
                    {isActive ? "In progress" : isComplete ? "Complete" : "Waiting"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>

      <aside className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-300">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Status</p>
        <div className="text-2xl font-semibold text-white">{renderStatus(status)}</div>
        <p>{job?.message ?? "Waiting for backend to move to the next stage."}</p>
        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Live contract</p>
          <p className="mt-2 font-mono text-xs text-slate-300">
            /api/analysis/{jobId}
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Next</p>
          <p className="mt-2">Once done, dashboard loads with timeline, graph, and contributor cards.</p>
        </div>
      </aside>
    </div>
  );
}

function renderStatus(status: JobStatus) {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "done":
      return "Done";
    case "failed":
      return "Failed";
    case "timeout":
      return "Timed out";
    case "invalid_repo":
      return "Invalid repo";
  }
}

function formatStatusMessage(status: JobStatus) {
  switch (status) {
    case "failed":
      return "Analysis failed. Check backend logs and retry with a smaller repo.";
    case "timeout":
      return "Analysis timed out. Try a smaller repository or fewer commits.";
    case "invalid_repo":
      return "Repo must be a public HTTPS GitHub URL.";
    default:
      return "Analysis stopped.";
  }
}
