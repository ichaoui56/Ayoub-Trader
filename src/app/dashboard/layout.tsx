import { redirect } from "next/navigation";
import AdminShell from "../../components/AdminShell";
import { getActiveAdmin } from "../../server/dashboard-auth";
import { prisma } from "../../server/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getActiveAdmin();
  if (!admin) redirect("/vip/login");
  const pendingApplications = await prisma.privateRoomRequest.count({
    where: { status: { in: ["SUBMITTED", "DEPOSIT_VERIFIED", "UNDER_REVIEW", "PROOF_REPORTED"] } },
  });
  return <AdminShell username={admin.username} pendingApplications={pendingApplications}>{children}</AdminShell>;
}