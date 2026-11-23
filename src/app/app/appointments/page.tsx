import { getCustomerAppData } from "../../../server/platform-queries";
import { CustomerAppointmentsPage } from "../../../components/CustomerPages";

export default async function CustomerAppointmentsRoute() {
  return <CustomerAppointmentsPage data={await getCustomerAppData()} />;
}