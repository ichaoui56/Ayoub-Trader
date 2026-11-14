import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getTransferDashboardIdentity } from "../server/transfer-actions";
import TransferDashboardLogin from "./TransferDashboardLogin";

export default async function TransferDashboardLoginWrapper() {
  await connection();
  if (await getTransferDashboardIdentity()) redirect("/dashboard");
  return <TransferDashboardLogin />;
}
