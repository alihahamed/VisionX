import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createAnalysis,
  getAnalysisJob,
  getAnalysisResult,
  getAnalysisSummary,
  getContributors,
  getGraph,
  getTimeline,
} from "./api";
import type { JobStatus } from "./types";

export function useCreateAnalysisMutation() {
  return useMutation({
    mutationFn: (repoUrl: string) => createAnalysis(repoUrl),
  });
}

export function useAnalysisJobQuery(jobId: string) {
  return useQuery({
    queryKey: ["analysis-job", jobId],
    queryFn: () => getAnalysisJob(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) {
        return 800;
      }
      return isTerminalStatus(status) ? false : 900;
    },
    enabled: Boolean(jobId),
  });
}

export function useAnalysisResultQuery(jobId: string) {
  return useQuery({
    queryKey: ["analysis-result", jobId],
    queryFn: () => getAnalysisResult(jobId),
    enabled: Boolean(jobId),
    retry: false,
  });
}

export function useAnalysisSummaryQuery(jobId: string) {
  return useQuery({
    queryKey: ["analysis-summary", jobId],
    queryFn: () => getAnalysisSummary(jobId),
    enabled: Boolean(jobId),
    retry: false,
  });
}

export function useTimelineQuery(jobId: string) {
  return useQuery({
    queryKey: ["analysis-timeline", jobId],
    queryFn: () => getTimeline(jobId),
    enabled: Boolean(jobId),
    retry: false,
  });
}

export function useGraphQuery(jobId: string) {
  return useQuery({
    queryKey: ["analysis-graph", jobId],
    queryFn: () => getGraph(jobId),
    enabled: Boolean(jobId),
    retry: false,
  });
}

export function useContributorsQuery(jobId: string) {
  return useQuery({
    queryKey: ["analysis-contributors", jobId],
    queryFn: () => getContributors(jobId),
    enabled: Boolean(jobId),
    retry: false,
  });
}

function isTerminalStatus(status: JobStatus) {
  return status === "done" || status === "failed" || status === "timeout" || status === "invalid_repo";
}
