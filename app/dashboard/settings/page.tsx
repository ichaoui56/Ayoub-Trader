import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export default function AccountSettingsPage() {
  return <TransferDashboardWrapper page="settings" />;
}