import { connection } from "next/server";
import App from "../App";
import { getPublicActivityCatalog } from "../server/activity-catalog";
import { getLocale } from "../server/locale";
import { localizeTree } from "../i18n";

export default async function Page() {
  if (process.env.DATABASE_URL) await connection();
  const [catalog, locale] = await Promise.all([getPublicActivityCatalog(), getLocale()]);
  const activities = localizeTree(catalog, locale);
  return <App activities={activities} locale={locale} />;
}
