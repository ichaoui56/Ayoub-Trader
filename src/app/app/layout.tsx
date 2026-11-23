import { redirect } from "next/navigation";
import CustomerAppShell from "../../components/CustomerAppShell";
import { LocaleProvider } from "../../components/LocaleProvider";
import { getVipClient } from "../../server/vip-auth";
import { maintainVipMemberships } from "../../server/vip-data";

export default async function CustomerAppLayout({ children }: { children: React.ReactNode }) {
  const client = await getVipClient();
  if (!client) redirect("/vip/login");
  await maintainVipMemberships();
  return <LocaleProvider initialLocale="en"><CustomerAppShell client={client}>{children}</CustomerAppShell></LocaleProvider>;
}