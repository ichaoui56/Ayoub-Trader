import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreatePrivateRoomForm } from "../../../../components/PrivateRoomForms";

export default function NewPrivateRoomPage() {
  return <div className="platform-page room-editor-page">
    <header className="room-editor-heading">
      <Link href="/dashboard/rooms" className="rooms-back-link"><ArrowLeft size={14} />Back to rooms</Link>
      <p className="dash-eyebrow">Trading management</p>
      <h1>Add a private room</h1>
      <p>Create a room for private trading content and member access.</p>
    </header>
    <CreatePrivateRoomForm />
  </div>;
}