import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Activity details",
  robots: { index: false, follow: false },
};

export default async function ActivityDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TransferDashboardWrapper page="activity-detail" detailId={slug} />;
}
