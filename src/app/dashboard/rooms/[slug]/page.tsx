import { getPlatformRoomData } from "../../../../server/platform-queries";
import { PlatformRoomPage } from "../../../../components/PlatformAdminPages";
import { AssignRoomCustomerForm, DeletePrivateRoomForm } from "../../../../components/PrivateRoomForms";
import Link from "next/link";
import { Pencil } from "lucide-react";

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = await getPlatformRoomData(slug);
  return <><div className="room-detail-route-actions"><Link className="rooms-edit-link" href={`/dashboard/rooms/${room.slug}/edit`}><Pencil size={14} />Edit room</Link></div><PlatformRoomPage room={room} /><AssignRoomCustomerForm roomId={room.id} customers={room.eligibleCustomers} /><DeletePrivateRoomForm roomId={room.id} roomName={room.name} blockers={room.deletionBlockers} /></>;
}