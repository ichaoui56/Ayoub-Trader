import { getActiveAdmin } from "../../../server/dashboard-auth";
import { AdminProfilePage } from "../../../components/PlatformAdminPages";

export default async function AdminProfileRoute() {
  const admin = await getActiveAdmin();
  if (!admin) throw new Error("An active administrator is required.");
  return <AdminProfilePage username={admin.username} email={admin.email} />;
}