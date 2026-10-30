import { connection } from "next/server";
import { getPublicTransferCatalog } from "../server/transfer-actions";
import AirportTransfer from "./AirportTransfer";
import type { Locale } from "../i18n";
import { localizeTree } from "../i18n";

export default async function AirportTransferWrapper({ locale }: { locale: Locale }) {
  await connection();
  const catalog = localizeTree(await getPublicTransferCatalog(), locale);
  return <AirportTransfer {...catalog} locale={locale} />;
}
