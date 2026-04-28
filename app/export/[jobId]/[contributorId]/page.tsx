import { ExportProfileClient } from "@/components/export-profile-client";

export default async function ExportProfilePage({
  params,
}: {
  params: Promise<{ jobId: string; contributorId: string }>;
}) {
  const { jobId, contributorId } = await params;
  return <ExportProfileClient jobId={jobId} contributorId={contributorId} />;
}
