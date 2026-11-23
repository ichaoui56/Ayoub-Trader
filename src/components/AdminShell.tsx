"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Bell,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Search,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { signOutAdmin } from "../server/admin-actions";

const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/users", label: "Users", Icon: Users },
  { href: "/dashboard/deposits", label: "Deposits", Icon: ArrowDownToLine },
  { href: "/dashboard/withdrawals", label: "Withdrawals", Icon: ArrowUpFromLine },
  { href: "/dashboard/transactions", label: "Transactions", Icon: ArrowLeftRight },
  { href: "/dashboard/profit-sharing", label: "Profit sharing", Icon: WalletCards },
  { href: "/dashboard/analytics", label: "Analytics", Icon: ChartNoAxesCombined },
  { href: "/dashboard/sessions", label: "Trading sessions", Icon: CalendarClock },
  { href: "/dashboard/meetings", label: "Meetings", Icon: CalendarDays },
];

export default function AdminShell({ children, username, pendingApplications }: { children: React.ReactNode; username: string; pendingApplications: number }) {
  const pathname = usePathname();
  const searchInput = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarWidth = collapsed ? "md:pl-[88px]" : "md:pl-[268px]";

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="admin-shell min-h-screen bg-[#050d0c] text-[#f3f8f5]">
      {mobileOpen && <button className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <aside className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-emerald-400/10 bg-[#071410] transition-all duration-200 ${collapsed ? "md:w-[76px]" : "md:w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className={`flex h-[76px] items-center border-b border-emerald-400/10 px-4 ${collapsed ? "md:justify-center md:px-2" : "justify-between"}`}>
          <Logo href="/dashboard" compact className={collapsed ? "md:hidden" : ""} />
          <span className={`hidden text-xs font-extrabold tracking-[.14em] text-[#00d68f] ${collapsed ? "md:block" : ""}`}>AT</span>
          <button className="grid size-9 place-items-center rounded-md text-[#91a59a] hover:bg-white/5 hover:text-white md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
          <button className="hidden size-9 place-items-center rounded-md text-[#91a59a] hover:bg-white/5 hover:text-white md:grid" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
          <p className={`mb-2 px-3 text-[9px] font-extrabold tracking-[.16em] text-[#53695d] ${collapsed ? "md:hidden" : ""}`}>MAIN</p>
          {primaryNavigation.slice(0, 1).map(({ href, label, Icon, exact }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined} aria-current={isActive(href, exact) ? "page" : undefined} className={`admin-nav-link mb-1 flex min-h-10 items-center gap-3 rounded-md px-3 text-xs font-semibold transition ${isActive(href, exact) ? "is-active" : "text-[#91a69b] hover:bg-white/[.04] hover:text-white"}`}><Icon size={17} /><span className={collapsed ? "md:hidden" : ""}>{label}</span></Link>)}
          <p className={`mb-2 mt-6 px-3 text-[9px] font-extrabold tracking-[.16em] text-[#53695d] ${collapsed ? "md:hidden" : ""}`}>TRADING MANAGEMENT</p>
          <Link href="/dashboard/rooms" onClick={() => setMobileOpen(false)} title={collapsed ? "Private Rooms" : undefined} aria-current={isActive("/dashboard/rooms") ? "page" : undefined} className={`admin-nav-link mb-1 flex min-h-10 items-center gap-3 rounded-md px-3 text-xs font-semibold transition ${isActive("/dashboard/rooms") ? "is-active" : "text-[#91a69b] hover:bg-white/[.04] hover:text-white"}`}><DoorOpen size={17} /><span className={collapsed ? "md:hidden" : ""}>Private Rooms</span></Link>
          {primaryNavigation.slice(1, 7).map(({ href, label, Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined} aria-current={isActive(href) ? "page" : undefined} className={`admin-nav-link mb-1 flex min-h-10 items-center gap-3 rounded-md px-3 text-xs font-semibold transition ${isActive(href) ? "is-active" : "text-[#91a69b] hover:bg-white/[.04] hover:text-white"}`}><Icon size={17} /><span className={collapsed ? "md:hidden" : ""}>{label}</span></Link>)}
          <p className={`mb-2 mt-6 px-3 text-[9px] font-extrabold tracking-[.16em] text-[#53695d] ${collapsed ? "md:hidden" : ""}`}>SCHEDULING</p>
          {primaryNavigation.slice(7).map(({ href, label, Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined} aria-current={isActive(href) ? "page" : undefined} className={`admin-nav-link mb-1 flex min-h-10 items-center gap-3 rounded-md px-3 text-xs font-semibold transition ${isActive(href) ? "is-active" : "text-[#91a69b] hover:bg-white/[.04] hover:text-white"}`}><Icon size={17} /><span className={collapsed ? "md:hidden" : ""}>{label}</span></Link>)}
        </nav>
        <div className="border-t border-emerald-400/10 p-3">
          <Link href="/dashboard/settings" className={`mb-1 flex min-h-10 items-center gap-3 rounded-md px-3 text-xs font-semibold text-[#91a59a] hover:bg-white/[.04] hover:text-white`} title={collapsed ? "Settings" : undefined}><Settings size={17} /><span className={collapsed ? "md:hidden" : ""}>Settings</span></Link>
          <Link href="/dashboard/profile" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-xs font-semibold text-[#91a59a] hover:bg-white/[.04] hover:text-white" title={collapsed ? "Admin profile" : undefined}><UserRound size={17} /><span className={collapsed ? "md:hidden" : ""}>Admin profile</span></Link>
          <form action={signOutAdmin}><button className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-xs font-semibold text-[#91a59a] hover:bg-white/[.04] hover:text-red-300" title={collapsed ? "Log out" : undefined}><LogOut size={17} /><span className={collapsed ? "md:hidden" : ""}>Log out</span></button></form>
        </div>
      </aside>
      <div className={`min-h-screen transition-[padding] duration-200 ${sidebarWidth}`}>
        <header className="admin-topbar sticky top-0 z-30 flex h-[68px] items-center justify-between gap-4 border-b border-emerald-400/10 bg-[#07110f]/95 px-4 backdrop-blur-md sm:px-7">
          <div className="flex min-w-0 items-center gap-3"><button className="grid size-9 place-items-center rounded-md border border-white/10 text-[#91a69b] md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={18} /></button><div className="hidden text-[11px] text-[#71877b] sm:block">Workspace <span className="mx-2 text-[#33463a]">/</span><span className="font-semibold capitalize text-[#dce9e1]">{pathname === "/dashboard" ? "Overview" : pathname.split("/").at(-1)?.replaceAll("-", " ")}</span></div></div>
          <form action="/dashboard/users" className="admin-global-search"><Search size={16} /><input ref={searchInput} type="search" name="q" placeholder="Search clients..." aria-label="Search users" /><kbd>⌘ K</kbd></form>
          <div className="flex shrink-0 items-center gap-2">
            <details className="admin-notifications relative"><summary aria-label={`${pendingApplications} pending room applications`} title="Pending room applications"><Bell size={17} />{pendingApplications > 0 && <span>{pendingApplications > 9 ? "9+" : pendingApplications}</span>}</summary><div className="admin-notification-popover"><strong>Pending room applications</strong><p>{pendingApplications ? `${pendingApplications} applications need review.` : "No applications are waiting for review."}</p><Link href="/dashboard/rooms">Open room management <ChevronRight size={13} /></Link></div></details>
            <details className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/[.04]"><span className="admin-user-avatar">{username.slice(0, 1).toUpperCase()}</span><span className="hidden text-xs font-semibold sm:block">{username}</span><ChevronDown size={14} className="text-[#71877b]" /></summary><div className="absolute right-0 top-12 z-50 w-48 rounded-md border border-white/10 bg-[#10251d] p-1 shadow-xl"><Link className="flex min-h-9 items-center gap-2 rounded px-2 text-xs text-[#b8c8be] hover:bg-white/[.05]" href="/dashboard/profile"><UserRound size={14} />Admin profile</Link><Link className="flex min-h-9 items-center gap-2 rounded px-2 text-xs text-[#b8c8be] hover:bg-white/[.05]" href="/dashboard/settings"><Settings size={14} />Settings</Link></div></details>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8">{children}</main>
      </div>
    </div>
  );
}