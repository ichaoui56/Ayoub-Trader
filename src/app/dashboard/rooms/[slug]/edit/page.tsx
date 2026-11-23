import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UpdatePrivateRoomForm } from "../../../../../components/PrivateRoomForms";
import { getPlatformRoomData } from "../../../../../server/platform-queries";

export default async function EditPrivateRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = await getPlatformRoomData(slug);
  return <div className="platform-page room-editor-page">
    <header className="room-editor-heading">
      <Link href={`/dashboard/rooms/${room.slug}`} className="rooms-back-link"><ArrowLeft size={14} />Back to {room.name}</Link>
      <p className="dash-eyebrow">Room settings</p>
      <h1>Update {room.name}</h1>
      <p>Update the room details and member availability.</p>
    </header>
    <UpdatePrivateRoomForm room={room} />
  </div>;
}