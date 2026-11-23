import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VipManagement from "../../../../components/VipManagement";
import { getVipAdminData } from "../../../../server/vip-admin-data";

export default async function PrivateRoomOperationsPage() {
  return <div className="platform-page vip-operations-page">
    <div className="vip-operations-toolbar">
      <Link href="/dashboard/rooms" className="rooms-back-link"><ArrowLeft size={14} />Back to room cards</Link>
    </div>
    <VipManagement data={await getVipAdminData()} />
  </div>;
}