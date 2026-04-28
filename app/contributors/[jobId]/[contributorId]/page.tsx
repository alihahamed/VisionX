import { ContributorClient } from "@/components/contributor-client";

export default async function ContributorPage({
  params,
}: {
  params: Promise<{ jobId: string; contributorId: string }>;
}) {
  const { jobId, contributorId } = await params;
  return <ContributorClient jobId={jobId} contributorId={contributorId} />;
}
