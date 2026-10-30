import { connection } from "next/server";
import { getPublicTransferCatalog } from "../server/transfer-actions";
import AirportTransfer from "./AirportTransfer";

export default async function AirportTransferWrapper() {
  await connection();
  const catalog = await getPublicTransferCatalog();
  return <AirportTransfer {...catalog} />;
}
