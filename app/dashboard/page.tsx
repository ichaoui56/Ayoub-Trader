import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import TradingDashboard from "../../src/components/TradingDashboard";
import { getActiveAdmin } from "../../src/server/dashboard-auth";
import { getTradingDashboardData } from "../../src/server/trading-data";

export const metadata: Metadata = {
  title: "Trading operations | Ayoub Trader",
  robots: { index: false, follow: false },
};

function authorizationIsConfigured() {
  try {
    return new URL(process.env.AYOUB_BROKER_AUTHORIZATION_URL ?? "").protocol === "https:";
  } catch {
    return false;
  }
}

export default async function DashboardOverviewPage() {
  await connection();
  if (!process.env.DATABASE_URL) {
    return <main className="min-h-screen bg-[#f5faf6] p-8 text-ink"><h1 className="font-display text-4xl font-extrabold uppercase">Trading dashboard setup required</h1><p className="mt-3 text-sm">Configure DATABASE_URL, apply the trading migration, then sign in again.</p></main>;
  }
  const user = await getActiveAdmin();
  if (!user) redirect("/dashboard/loginP");
  const data = await getTradingDashboardData();
  return <TradingDashboard data={data} username={user.username} authorizationConfigured={authorizationIsConfigured()} />;
}
