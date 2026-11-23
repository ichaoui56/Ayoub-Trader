import { getPlatformCoachingSchedule } from "../../../server/platform-queries";
import { CoachingSchedulePage } from "../../../components/PlatformAdminPages";

export default async function SessionsPage() {
  return <CoachingSchedulePage title="Trading sessions" bookings={await getPlatformCoachingSchedule()} />;
}