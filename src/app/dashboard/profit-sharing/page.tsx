import { getFinancialLedger } from "../../../server/platform-queries";
import { ProfitSharingPage } from "../../../components/PlatformAdminPages";

export default async function ProfitSharingPageRoute() {
  return <ProfitSharingPage ledger={await getFinancialLedger()} />;
}