import { cookies } from "next/headers";
import type { Locale } from "../i18n";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("morocco-locale")?.value;
  return value === "fr" ? "fr" : "en";
}
