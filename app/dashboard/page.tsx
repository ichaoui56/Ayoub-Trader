import type { Metadata } from "next";
import TransferDashboardWrapper from "../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Dashboard overview | Morocco Journeys",
  robots: { index: false, follow: false },
};

export default function DashboardOverviewPage() {
  return <TransferDashboardWrapper page="overview" />;
}
