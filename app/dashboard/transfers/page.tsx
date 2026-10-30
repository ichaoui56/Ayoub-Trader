import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Transfer operations",
  robots: { index: false, follow: false },
};

export default function TransferDashboardPage() {
  return <TransferDashboardWrapper page="transfers" />;
}
