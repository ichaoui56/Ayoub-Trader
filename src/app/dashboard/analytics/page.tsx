import { getPlatformOverview } from "../../../server/platform-dashboard";
import PlatformDashboard from "../../../components/PlatformDashboard";

export default async function AnalyticsPage() {
  return <PlatformDashboard overview={await getPlatformOverview("1Y")} />;
}