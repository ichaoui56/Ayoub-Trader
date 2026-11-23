import { getCustomerAppData } from "../../server/platform-queries";
import { CustomerHomePage } from "../../components/CustomerPages";

export default async function CustomerHomeRoute() {
  return <CustomerHomePage data={await getCustomerAppData()} />;
}