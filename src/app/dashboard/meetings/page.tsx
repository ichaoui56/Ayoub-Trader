import { getPlatformCoachingSchedule } from "../../../server/platform-queries";
import { CoachingSchedulePage } from "../../../components/PlatformAdminPages";

export default async function MeetingsPage() {
  return <CoachingSchedulePage title="Meetings" meetings bookings={await getPlatformCoachingSchedule()} />;
}