"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BadgeCheck, FileText, House, LockKeyhole, LogOut, UserRound } from "lucide-react";
import { signOutVipClient } from "../server/vip-actions";

const navigation = [
  { href: "/vip/dashboard", label: "Home", Icon: House },
  { href: "/vip/dashboard/rooms", label: "VIP rooms", Icon: LockKeyhole },
  { href: "/vip/dashboard/applications", label: "Applications", Icon: FileText },
  { href: "/vip/dashboard/membership", label: "Membership", Icon: BadgeCheck },
  { href: "/vip/dashboard/profile", label: "Profile", Icon: UserRound },
];

export default function VipClientShell({
  children,
  client,
}: {
  children: React.ReactNode;
  client: { name: string; clientId: string; email: string };
}) {
  const currentPath = usePathname();
  return (
    <div className="min-h-screen bg-[#f4f5f1] text-[#172019]">
      <header className="border-b border-[#172019]/10 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/vip/dashboard" className="inline-flex min-w-0 items-center gap-3" aria-label="VIP Private Rooms home">
            <span className="grid size-9 shrink-0 place-items-center bg-[#16221a] text-[#c7b47e]"><LockKeyhole size={17} /></span>
            <span className="min-w-0"><span className="block font-display text-lg font-extrabold uppercase leading-none">Private rooms</span><span className="mt-1 block truncate text-[9px] font-bold uppercase tracking-[0.14em] text-[#68736a]">Client area · {client.clientId}</span></span>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/vip/dashboard/notifications" className="relative grid size-10 place-items-center border border-[#172019]/10 transition hover:bg-[#f4f5f1]" aria-label="Notifications"><Bell size={17} /></Link>
            <form action={signOutVipClient}><button className="inline-flex min-h-10 items-center gap-2 border border-[#172019]/10 px-3 text-xs font-bold transition hover:bg-[#f4f5f1]" type="submit"><LogOut size={15} /><span className="hidden sm:inline">Sign out</span></button></form>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl items-center gap-1 px-6 pb-3 md:flex" aria-label="Client navigation">
          {navigation.map(({ href, label, Icon }) => {
            const active = currentPath === href || (href !== "/vip/dashboard" && currentPath.startsWith(href));
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 border-b-2 px-4 text-xs font-semibold transition ${active ? "border-[#087a2f] text-[#087a2f]" : "border-transparent text-[#68736a] hover:text-[#172019]"}`}><Icon size={15} />{label}</Link>;
          })}
        </nav>
      </header>
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-7 sm:px-6 md:pb-12 md:pt-10">{children}</main>
      <nav className="fixed inset-x-3 bottom-0 z-50 mb-[env(safe-area-inset-bottom)] grid grid-cols-5 border border-[#ffffff]/10 bg-[#152019]/95 px-1 pb-1 pt-2 text-white shadow-[0_-8px_30px_rgba(15,28,19,0.16)] backdrop-blur-xl md:hidden" aria-label="Client navigation">
        {navigation.map(({ href, label, Icon }) => {
          const active = currentPath === href || (href !== "/vip/dashboard" && currentPath.startsWith(href));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 text-[9px] font-semibold transition ${active ? "border-[#c7b47e] text-[#e2d3a9]" : "border-transparent text-white/55"}`}><Icon size={19} strokeWidth={active ? 2.4 : 1.8} /><span>{label}</span></Link>;
        })}
      </nav>
    </div>
  );
}