import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getTransferDashboardData } from "../server/transfer-actions";
import { getManagedActivityCatalog, getManagedActivityCount } from "../server/activity-catalog";
import { getActivityReservationCount, getActivityReservations } from "../server/activity-reservations";
import TransferDashboard from "./TransferDashboard";

export type DashboardPage = "overview" | "requests" | "transfers" | "activities" | "activity-reservations";

export default async function TransferDashboardWrapper({
  page,
}: {
  page: DashboardPage;
}) {
  await connection();
  const result = await getTransferDashboardData();
  if (!result.authorized) redirect("/dashboard/loginP");
  if ((page === "transfers" || page === "activities" || page === "activity-reservations") && result.user.role !== "ADMIN") {
    redirect("/dashboard/requests");
  }
  const managedActivities = page === "activities" ? await getManagedActivityCatalog() : [];
  const managedActivityCount = page === "activities"
    ? managedActivities.length
    : result.user.role === "ADMIN"
      ? await getManagedActivityCount()
      : 0;
  const activityReservations = page === "activity-reservations" ? await getActivityReservations() : [];
  const activityReservationCount = result.user.role !== "ADMIN"
    ? 0
    : page === "activity-reservations"
      ? activityReservations.length
      : await getActivityReservationCount();
  return (
    <TransferDashboard
      user={result.user}
      data={result.data}
      page={page}
      managedActivities={managedActivities}
      managedActivityCount={managedActivityCount}
      activityReservations={activityReservations}
      activityReservationCount={activityReservationCount}
    />
  );
}
