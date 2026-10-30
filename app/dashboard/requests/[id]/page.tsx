import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Transfer request details | Morocco Journeys",
  robots: { index: false, follow: false },
};

export default async function TransferRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TransferDashboardWrapper page="request-detail" detailId={id} />;
}
