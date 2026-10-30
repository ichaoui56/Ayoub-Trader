import type { Metadata } from "next";
import TransferDashboardWrapper from "../../../src/components/TransferDashboardWrapper";

export const metadata: Metadata = {
  title: "Website SEO",
  robots: { index: false, follow: false },
};

export default function WebsiteSeoPage() {
  return <TransferDashboardWrapper page="seo" />;
}