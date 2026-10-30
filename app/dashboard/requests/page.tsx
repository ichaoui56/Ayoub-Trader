import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Transfer requests",
  robots: { index: false, follow: false },
};

export default function TransferRequestsPage() {
  return <TransferDashboardWrapper page="requests" />;
}
