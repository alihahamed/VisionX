import type { AnalysisJob, AnalysisResult } from "./types";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const message =
      error?.detail?.error?.message ||
      error?.error?.message ||
      `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
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

  return parseResponse<AnalysisJob>(response);
}

export async function getAnalysisJob(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}`, {
    cache: "no-store",
  });

  return parseResponse<AnalysisJob>(response);
}

export async function getAnalysisResult(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}/result`, {
    cache: "no-store",
  });

  return parseResponse<AnalysisResult>(response);
}

export async function getTimeline(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}/timeline`, {
    cache: "no-store",
  });

  return parseResponse<{ job_id: string; decisions: AnalysisResult["decisions"] }>(response);
}

export async function getGraph(jobId: string) {
  const response = await fetch(`${apiBaseUrl()}/api/analysis/${jobId}/graph`, {
    cache: "no-store",
  });

  return parseResponse<{ job_id: string; graph: AnalysisResult["graph"] }>(response);
}

export async function getContributor(jobId: string, contributorId: string) {
  const response = await fetch(
    `${apiBaseUrl()}/api/analysis/${jobId}/contributors/${contributorId}`,
    {
      cache: "no-store",
    },
  );

  return parseResponse<{ job_id: string; contributor: AnalysisResult["contributors"][number] }>(
    response,
  );
}
