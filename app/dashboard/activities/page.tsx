import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Manage activities | Morocco Journeys",
  robots: { index: false, follow: false },
};

export default function ManageActivitiesPage() {
  return <TransferDashboardWrapper page="activities" />;
}
