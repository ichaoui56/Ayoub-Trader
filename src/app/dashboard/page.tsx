import { getPlatformOverview } from "../../server/platform-dashboard";
import PlatformDashboard from "../../components/PlatformDashboard";

export default async function DashboardOverviewPage({ searchParams }: { searchParams: Promise<{ period?: string; room?: string; currency?: string }> }) {
  const filters = await searchParams;
  const overview = await getPlatformOverview(filters.period, filters.room, filters.currency);
  return <PlatformDashboard overview={overview} />;
}
