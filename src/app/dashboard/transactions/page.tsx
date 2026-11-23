import { getFinancialLedger } from "../../../server/platform-queries";
import { FinancialLedgerPage } from "../../../components/PlatformAdminPages";

export default async function TransactionsPage() {
  return <FinancialLedgerPage title="Transactions" ledger={await getFinancialLedger()} />;
}