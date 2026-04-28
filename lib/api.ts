import type {
  AnalysisCreateResponse,
  AnalysisJob,
  AnalysisResult,
  AnalysisSummary,
} from "./types";
import {
  analysisCreateResponseSchema,
  analysisJobSchema,
  analysisResultSchema,
  analysisSummarySchema,
  contributorResponseSchema,
  contributorsResponseSchema,
  timelineSchema,
} from "./schemas";

const DEFAULT_API_BASE_URL = "/backend-api";

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const message =
      error?.detail?.error?.message ||
      error?.error?.message ||
      `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function createAnalysis(repoUrl: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repo_url: repoUrl }),
    cache: "no-store",
  });

  const payload = await parseResponse(response);
  return analysisCreateResponseSchema.parse(payload) as AnalysisCreateResponse;
}

export async function getAnalysisJob(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}`, {
    cache: "no-store",
  });

  const payload = await parseResponse(response);
  return analysisJobSchema.parse(payload) as AnalysisJob;
}

export async function getAnalysisResult(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}/result`, {
    cache: "no-store",
  });

  const payload = await parseResponse(response);
  return analysisResultSchema.parse(payload) as AnalysisResult;
}

export async function getAnalysisSummary(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}/summary`, {
    cache: "no-store",
  });

  const payload = await parseResponse(response);
  return analysisSummarySchema.parse(payload) as AnalysisSummary;
}

export async function getTimeline(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}/timeline`, {
    cache: "no-store",
  });

  const payload = await parseResponse(response);
  return timelineSchema.parse(payload) as { job_id: string; decisions: AnalysisResult["decisions"] };
}

export async function getGraph(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}/graph`, {
    cache: "no-store",
  });

  const payload = await parseResponse(response);
  const parsed = analysisResultSchema
    .pick({ graph: true, job_id: true })
    .safeParse(payload);
  if (parsed.success) {
    return parsed.data as { job_id: string; graph: AnalysisResult["graph"] };
  }
  const generic = payload as { job_id: string; graph: AnalysisResult["graph"] };
  return generic;
}

export async function getContributor(jobId: string, contributorId: string) {
  const response = await fetch(
    `${apiBaseUrl()}/api/analysis/${jobId}/contributors/${contributorId}`,
    {
      cache: "no-store",
    },
  );

  const payload = await parseResponse(response);
  return contributorResponseSchema.parse(payload) as {
    job_id: string;
    contributor: AnalysisResult["contributors"][number];
  };
}

export async function getContributors(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}/contributors`, {
    cache: "no-store",
  });

  const payload = await parseResponse(response);
  return contributorsResponseSchema.parse(payload) as {
    job_id: string;
    contributors: AnalysisResult["contributors"];
  };
}
