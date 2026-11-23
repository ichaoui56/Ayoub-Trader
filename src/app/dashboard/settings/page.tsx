import { getActiveAdmin } from "../../../server/dashboard-auth";
import { AdminSettingsPage } from "../../../components/PlatformAdminPages";

export default async function SettingsPage() {
  const admin = await getActiveAdmin();
  if (!admin) throw new Error("An active administrator is required.");
  return <AdminSettingsPage username={admin.username} email={admin.email} />;
}