import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getTransferDashboardData } from "../server/transfer-actions";
import TransferDashboard from "./TransferDashboard";

export type DashboardPage = "overview" | "requests" | "transfers";

export default async function TransferDashboardWrapper({
  page,
}: {
  page: DashboardPage;
}) {
  await connection();
  const result = await getTransferDashboardData();
  if (!result.authorized) redirect("/dashboard/loginP");
  if (page === "transfers" && result.user.role !== "ADMIN") {
    redirect("/dashboard/requests");
  }
  return (
    <TransferDashboard
      user={result.user}
      data={result.data}
      page={page}
    />
  );
}
