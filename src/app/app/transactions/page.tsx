import { getCustomerAppData } from "../../../server/platform-queries";
import { CustomerTransactionsPage } from "../../../components/CustomerPages";

export default async function CustomerTransactionsRoute() {
  return <CustomerTransactionsPage data={await getCustomerAppData()} />;
}