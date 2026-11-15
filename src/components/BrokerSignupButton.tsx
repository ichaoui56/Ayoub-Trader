"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "./LocaleProvider";

export default function BrokerSignupButton({ href }: { href: string | null }) {
  const pathname = usePathname();
  const { t } = useLocale();

  if (!href || pathname.startsWith("/dashboard")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("Open broker account")}
      className="fixed bottom-4 right-4 z-30 inline-flex min-h-12 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-white/50 bg-[#079653] px-5 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-[0_12px_32px_rgb(6_45_48/24%)] transition duration-300 hover:-translate-y-1 hover:bg-[#073D35] hover:shadow-[0_16px_36px_rgb(6_45_48/30%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#10B981] active:translate-y-0"
    >
      <span>{t("Open broker account")}</span>
      <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-base">↗</span>
    </a>
  );
}