import { getCustomerAppData } from "../../../server/platform-queries";
import { CustomerRoomsPage } from "../../../components/CustomerPages";

export default async function CustomerRoomsRoute() {
  return <CustomerRoomsPage data={await getCustomerAppData()} />;
}