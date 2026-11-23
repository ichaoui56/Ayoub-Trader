import { getFinancialLedger } from "../../../server/platform-queries";
import { FinancialLedgerPage } from "../../../components/PlatformAdminPages";

export default async function WithdrawalsPage() {
  return <FinancialLedgerPage title="Withdrawals" type="WITHDRAWAL" ledger={await getFinancialLedger("WITHDRAWAL")} />;
}