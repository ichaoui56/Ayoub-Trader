import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Manage journal",
  robots: { index: false, follow: false },
};

export default function ManageBlogsPage() {
  return <TransferDashboardWrapper page="blogs" />;
}