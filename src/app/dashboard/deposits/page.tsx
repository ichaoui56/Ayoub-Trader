import { getFinancialLedger } from "../../../server/platform-queries";
import { FinancialLedgerPage } from "../../../components/PlatformAdminPages";

export default async function DepositsPage() {
  return <FinancialLedgerPage title="Deposits" type="DEPOSIT" ledger={await getFinancialLedger("DEPOSIT")} />;
}