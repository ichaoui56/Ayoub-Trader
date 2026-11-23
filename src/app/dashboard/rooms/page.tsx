import { getPlatformRooms } from "../../../server/platform-queries";
import { PlatformRoomsPage } from "../../../components/PlatformAdminPages";

export default async function RoomsPage() {
  return <PlatformRoomsPage rooms={await getPlatformRooms()} />;
}