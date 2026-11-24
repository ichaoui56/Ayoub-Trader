"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Copy, House, LogOut, UserRound, UsersRound } from "lucide-react";
import { signOutVipClient } from "../server/vip-actions";
import Logo from "./Logo";
import { useLocale } from "./LocaleProvider";

const navigation = [
  { href: "/app", label: "Home", Icon: House, exact: true },
  { href: "/app/rooms", label: "Rooms", Icon: UsersRound },
  { href: "/app/copy-trading", label: "Copy trading", Icon: Copy },
  { href: "/app/appointments", label: "Meetings", Icon: CalendarDays },
  { href: "/app/profile", label: "Account", Icon: UserRound },
];

export default function CustomerAppShell({ children, client }: { children: React.ReactNode; client: { name: string; clientId: string } }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="min-h-screen bg-[#030b0a] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-[#f5faf7] md:pb-10">
      <header className="sticky top-0 z-30 border-b border-emerald-400/10 bg-[#030b0a]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo href="/app" compact className="w-16" />
          <div className="flex items-center gap-3"><div className="customer-language-switch" role="group" aria-label={t("Choose language")}>{(["en", "fr", "ar"] as const).map((option) => <button key={option} type="button" aria-pressed={locale === option} onClick={() => setLocale(option)}>{option === "ar" ? "ع" : option.toUpperCase()}</button>)}</div><span className="hidden text-right sm:block"><strong className="block text-xs">{client.name}</strong><small className="text-[10px] text-[#71877b]">{client.clientId}</small></span><Link href="/app/profile" className="grid size-9 place-items-center rounded-full border border-emerald-400/15 bg-[#0b1b16] text-[#91a59a]" aria-label="Profile"><UserRound size={16} /></Link><form action={signOutVipClient}><button className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/10 px-2.5 text-xs font-bold text-[#91a59a] transition hover:border-red-400/30 hover:text-red-300 sm:px-3" aria-label="Log out"><LogOut size={15} /><span className="hidden sm:inline">Log out</span></button></form></div>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100svh-8rem)] w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-400/15 bg-[#071411]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl md:left-1/2 md:right-auto md:mb-5 md:w-[min(100%-2rem,30rem)] md:-translate-x-1/2 md:rounded-xl md:border" aria-label="Customer navigation">
        <div className="grid grid-cols-4">{navigation.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[9px] font-semibold transition ${active ? "bg-[#00e676]/[.08] text-[#00e676]" : "text-[#73877b] hover:text-white"}`}><Icon size={18} strokeWidth={active ? 2.4 : 1.8} /><span>{t(label)}</span></Link>;
        })}</div>
      </nav>
    </div>
  );
}