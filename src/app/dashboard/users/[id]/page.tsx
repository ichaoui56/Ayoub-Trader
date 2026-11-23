import { getPlatformUserDetail } from "../../../../server/platform-queries";
import { PlatformUserDetailPage } from "../../../../components/PlatformAdminPages";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlatformUserDetailPage user={await getPlatformUserDetail(id)} />;
}