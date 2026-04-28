import { z } from "zod";

export const jobStatusSchema = z.enum([
  "queued",
  "running",
  "done",
  "failed",
  "timeout",
  "invalid_repo",
]);

export const progressStageSchema = z.enum(["ingest", "classify", "detect", "graph", "narrate"]);

export const analysisJobSchema = z.object({
  job_id: z.string(),
  status: jobStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  progress_stage: progressStageSchema.nullish().transform((v) => v ?? undefined),
  message: z.string().nullish().transform((v) => v ?? undefined),
  error_code: z.string().nullish().transform((v) => v ?? undefined),
  error_message: z.string().nullish().transform((v) => v ?? undefined),
});

export const analysisCreateResponseSchema = z.object({
  job_id: z.string(),
  status: jobStatusSchema,
  created_at: z.string(),
});

const evidenceSchema = z.object({
  commit_sha: z.string(),
  file_paths: z.array(z.string()).optional(),
  reason: z.string(),
});

const decisionSchema = z.object({
  decision_id: z.string(),
  type: z.enum(["convergence", "replacement", "unblocking", "correction", "architectural_pivot"]),
  title: z.string(),
  summary: z.string(),
  contributor_id: z.string(),
  timestamp: z.string(),
  confidence: z.number(),
  evidence: z.array(evidenceSchema),
});

const graphNodeSchema = z.object({
  id: z.string(),
  kind: z.enum(["contributor", "decision"]),
  label: z.string(),
  influence_score: z.number(),
});

const graphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  weight: z.number(),
  relation: z.enum(["builds_on", "unblocks", "corrects"]),
});

const contributorSchema = z.object({
  contributor_id: z.string(),
  name: z.string(),
  role: z.enum(["Initiator", "Implementer", "Corrector", "Unblocker"]),
  narrative: z.string(),
  confidence: z.number(),
  top_decisions: z.array(z.string()),
  evidence: z.array(
    z.object({
      commit_sha: z.string(),
      reason: z.string(),
    }),
  ),
});

export const analysisResultSchema = z.object({
  job_id: z.string(),
  project: z.object({
    name: z.string(),
    repo_url: z.string(),
    commit_count: z.number(),
    contributors_count: z.number(),
  }),
  decisions: z.array(decisionSchema),
  graph: z.object({
    nodes: z.array(graphNodeSchema),
    edges: z.array(graphEdgeSchema),
  }),
  contributors: z.array(contributorSchema),
  warnings: z.array(z.string()),
});

export const analysisSummarySchema = z.object({
  job_id: z.string(),
  project: z.object({
    name: z.string(),
    repo_url: z.string(),
    commit_count: z.number(),
    contributors_count: z.number(),
  }),
  warnings: z.array(z.string()),
});

export const timelineSchema = z.object({
  job_id: z.string(),
  decisions: z.array(decisionSchema),
});

export const contributorResponseSchema = z.object({
  job_id: z.string(),
  contributor: contributorSchema,
});

export const contributorsResponseSchema = z.object({
  job_id: z.string(),
  contributors: z.array(contributorSchema),
});
