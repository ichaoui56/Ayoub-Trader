import App from "../src/App";
import { connection } from "next/server";
import { getPublicActivityCatalog } from "../src/server/activity-catalog";
import { getLocale } from "../src/server/locale";
import { localizeTree } from "../src/i18n";

export default async function Page() {
  if (process.env.DATABASE_URL) await connection();
  const [catalog, locale] = await Promise.all([getPublicActivityCatalog(), getLocale()]);
  const activities = localizeTree(catalog, locale);
  return <App activities={activities} locale={locale} />;
}
