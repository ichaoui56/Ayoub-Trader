import { getPlatformUsers } from "../../../server/platform-queries";
import { PlatformUsersPage } from "../../../components/PlatformAdminPages";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <PlatformUsersPage users={await getPlatformUsers(q)} />;
}