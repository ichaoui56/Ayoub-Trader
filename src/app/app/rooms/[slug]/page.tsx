import { getCustomerAppData } from "../../../../server/platform-queries";
import { CustomerRoomDetailPage } from "../../../../components/CustomerPages";

export default async function CustomerRoomRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CustomerRoomDetailPage data={await getCustomerAppData()} slug={slug} />;
}