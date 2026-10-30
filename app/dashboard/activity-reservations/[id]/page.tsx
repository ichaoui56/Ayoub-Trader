import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Activity reservation details | Morocco Journeys",
  robots: { index: false, follow: false },
};

export default async function ActivityReservationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TransferDashboardWrapper page="activity-reservation-detail" detailId={id} />;
}
