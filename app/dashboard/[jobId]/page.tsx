import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <DashboardClient jobId={jobId} />;
}
