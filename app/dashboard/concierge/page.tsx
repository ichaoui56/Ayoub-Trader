import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Manage Concierge section",
  robots: { index: false, follow: false },
};

export default function ManageConciergePage() {
  return <TransferDashboardWrapper page="concierge" />;
}