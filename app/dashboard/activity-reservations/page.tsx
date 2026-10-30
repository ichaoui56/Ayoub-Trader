import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Activity reservations | Morocco Journeys",
  robots: { index: false, follow: false },
};

export default function ActivityReservationsPage() {
  return <TransferDashboardWrapper page="activity-reservations" />;
}
