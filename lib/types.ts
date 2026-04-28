export type JobStatus =
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "timeout"
  | "invalid_repo";

export type RoleTag = "Initiator" | "Implementer" | "Corrector" | "Unblocker";

export type DecisionType =
  | "convergence"
  | "replacement"
  | "unblocking"
  | "correction"
  | "architectural_pivot";

export interface AnalysisJob {
  job_id: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  progress_stage?: "ingest" | "classify" | "detect" | "graph" | "narrate";
  message?: string;
}

export interface EvidenceRef {
  commit_sha: string;
  file_paths?: string[];
  reason: string;
}

export interface DecisionMoment {
  decision_id: string;
  type: DecisionType;
  title: string;
  summary: string;
  contributor_id: string;
  timestamp: string;
  confidence: number;
  evidence: EvidenceRef[];
}

export interface GraphNode {
  id: string;
  kind: "contributor" | "decision";
  label: string;
  influence_score: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  relation: "builds_on" | "unblocks" | "corrects";
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ContributorProfile {
  contributor_id: string;
  name: string;
  role: RoleTag;
  narrative: string;
  confidence: number;
  top_decisions: string[];
  evidence: EvidenceRef[];
}

export interface ProjectSummary {
  name: string;
  repo_url: string;
  commit_count: number;
  contributors_count: number;
}

export interface AnalysisResult {
  job_id: string;
  project: ProjectSummary;
  decisions: DecisionMoment[];
  graph: GraphPayload;
  contributors: ContributorProfile[];
  warnings: string[];
}
