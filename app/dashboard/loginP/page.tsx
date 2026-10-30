import type { Metadata } from "next";
import TransferDashboardLoginWrapper from "../../../src/components/TransferDashboardLoginWrapper";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function TransferDashboardLoginPage() {
  return <TransferDashboardLoginWrapper />;
}
