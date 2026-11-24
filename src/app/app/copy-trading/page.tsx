import { getCustomerAppData } from "../../../server/platform-queries";
import { CustomerCopyTradingPage } from "../../../components/CustomerPages";

export default async function CustomerCopyTradingRoute() {
  return <CustomerCopyTradingPage data={await getCustomerAppData()} />;
}
