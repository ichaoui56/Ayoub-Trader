import { getCustomerAppData } from "../../../server/platform-queries";
import { CustomerProfilePage } from "../../../components/CustomerPages";

export default async function CustomerProfileRoute() {
  return <CustomerProfilePage data={await getCustomerAppData()} />;
}