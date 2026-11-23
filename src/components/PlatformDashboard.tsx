import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowLeftRight,
  ArrowUpFromLine,
  ArrowUpRight,
  Activity,
  Clock3,
  Users,
  Wallet,
  ChartNoAxesCombined,
} from "lucide-react";
import type { DashboardPeriod } from "../server/platform-dashboard";
import PerformanceChart from "./PerformanceChart";

type Overview = Awaited<ReturnType<typeof import("../server/platform-dashboard").getPlatformOverview>>;

const periods: DashboardPeriod[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];
const roomColors: Record<string, string> = { vip: "#00D68F", pro: "#00B8FF", standard: "#A970FF" };

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : dateLabel(value);
}

function AmountLines({ values }: { values: Array<{ currency: string; amount: number }> }) {
  if (!values.length) return <span className="dash-empty-value">No records</span>;
  return <span className="dash-multi-amount">{values.map(({ currency, amount }) => <span key={currency}>{money(amount, currency)}</span>)}</span>;
}

export default function PlatformDashboard({ overview }: { overview: Overview }) {
  const memberCount = overview.rooms.reduce((sum, room) => sum + room.members, 0);
  const series = overview.currency === "all"
    ? overview.performance.length === 1 ? overview.performance[0] : null
    : overview.performance.find((item) => item.currency === overview.currency) ?? null;
  const selectedStats = series ? overview.performanceStats.find((item) => item.currency === series.currency) : null;
  const activity = [
    ...overview.recentUsers.map((user) => ({
      id: `user-${user.id}`, kind: "user" as const, title: "New user registered",
      description: `${user.name} · ${user.email ?? "No email on file"}`,
      createdAt: user.createdAt, status: user.hasActiveMembership ? "Active" : "Registered",
    })),
    ...overview.transactions.map((transaction) => ({
      id: `transaction-${transaction.id}`, kind: "transaction" as const,
      title: transaction.type.replaceAll("_", " ").toLowerCase(),
      description: `${transaction.customer} · ${money(transaction.amount, transaction.currency)}${transaction.room ? ` · ${transaction.room}` : ""}`,
      createdAt: transaction.createdAt, status: transaction.status,
    })),
  ].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 7);
  const cards = [
    { label: "Total users", value: overview.summary.users.toLocaleString(), detail: `${overview.summary.activeMembers.toLocaleString()} active room memberships`, Icon: Users, tone: "green", note: "Registered clients" },
    { label: "Total deposits", value: <AmountLines values={overview.summary.deposits} />, detail: "Verified and completed", Icon: ArrowDownLeft, tone: "blue", note: "All recorded time" },
    { label: "Total profit", value: <AmountLines values={overview.summary.profit} />, detail: "Completed ledger entries", Icon: ChartNoAxesCombined, tone: "violet", note: "All recorded time" },
    { label: "Total withdrawals", value: <AmountLines values={overview.summary.withdrawals} />, detail: "Verified and completed", Icon: ArrowUpFromLine, tone: "amber", note: "All recorded time" },
  ];
  const date = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());

  return (
    <div className="platform-dashboard">
      <div className="dash-welcome-row"><div><p className="dash-eyebrow">{date}</p><h1>Welcome back, <span>Admin</span></h1><p className="dash-subtitle">Here&apos;s what&apos;s happening with your trading platform today.</p></div><Link className="dash-quick-link" href="/dashboard/users"><Users size={15} />Manage users <ArrowRight size={14} /></Link></div>

      <section className="dash-kpis" aria-label="Platform totals">
        {cards.map(({ label, value, detail, Icon, tone, note }) => <article className={`dash-kpi is-${tone}`} key={label}><div className="dash-kpi-top"><span>{label}</span><i><Icon size={18} /></i></div><strong className="dash-kpi-value">{value}</strong><p>{detail}</p><span className="dash-kpi-comparison">{note}</span></article>)}
      </section>

      <div className="dash-main-grid">
        <section className="dash-panel dash-performance">
          <div className="dash-section-head"><div><h2>Trading performance</h2><p>Completed profit entries in the selected range</p></div><form className="dash-filters" action="/dashboard"><select aria-label="Performance room" name="room" defaultValue={overview.roomSlug}><option value="all">All rooms</option>{overview.rooms.map((room) => <option key={room.id} value={room.slug}>{room.name}</option>)}</select><select aria-label="Chart currency" name="currency" defaultValue={overview.currency}><option value="all">All currencies</option>{overview.currencies.map((currency) => <option key={currency}>{currency}</option>)}</select><input type="hidden" name="period" value={overview.period} /><button type="submit">Apply filters</button></form></div>
          <div className="dash-period-tabs" role="group" aria-label="Performance period">{periods.map((period) => <Link key={period} href={`/dashboard?period=${period}&room=${overview.roomSlug}&currency=${overview.currency}`} aria-current={overview.period === period ? "true" : undefined} className={overview.period === period ? "is-active" : ""}>{period}</Link>)}</div>
          <div className="dash-performance-metrics"><div><span>Recorded profit</span><strong>{series ? money(series.points.reduce((sum, point) => sum + point.total, 0), series.currency) : "Multiple currencies"}</strong></div><div><span>Profit entries</span><strong>{overview.performanceStats.reduce((sum, item) => sum + item.entries, 0).toLocaleString()}</strong></div><div><span>Average entry</span><strong>{selectedStats ? money(selectedStats.average, selectedStats.currency) : "Select a currency"}</strong></div></div>
          {series?.points.length ? <PerformanceChart points={series.points} currency={series.currency} period={overview.period} /> : <div className="dash-chart-empty"><ChartNoAxesCombined size={25} /><strong>No completed profit records</strong><span>{overview.performance.length > 1 && overview.currency === "all" ? "Choose a currency to view its recorded performance." : "Recorded profit entries will appear here for the selected filters."}</span></div>}
        </section>

        <section className="dash-panel dash-distribution">
          <div className="dash-section-head"><div><h2>Room distribution</h2><p>Current active assignments</p></div></div>
          {memberCount ? <><div className="dash-donut" style={{ background: `conic-gradient(${overview.rooms.map((room, index) => `${roomColors[room.slug] ?? "#60756A"} ${overview.rooms.slice(0, index).reduce((sum, item) => sum + item.members, 0) / memberCount * 100}% ${overview.rooms.slice(0, index + 1).reduce((sum, item) => sum + item.members, 0) / memberCount * 100}%`).join(", ")}` }}><div><strong>{memberCount.toLocaleString()}</strong><span>members</span></div></div><div className="dash-room-legend">{overview.rooms.map((room) => <div key={room.id}><i style={{ background: roomColors[room.slug] ?? "#60756A" }} /><span>{room.name}</span><strong>{room.members}</strong><small>{Math.round(room.members / memberCount * 100)}%</small></div>)}</div></> : <div className="dash-empty-state"><Users size={21} /><strong>No room assignments yet</strong><span>Active member distribution will appear here when rooms have members.</span></div>}
        </section>

        <section className="dash-panel dash-recent-users">
          <div className="dash-section-head"><div><h2>Recent activity</h2><p>Latest registrations and financial events</p></div><Link href="/dashboard/transactions">View ledger <ArrowRight size={14} /></Link></div>
          {activity.length ? <div className="dash-row-list dash-activity-list">{activity.map((item) => <div className="dash-activity-row" key={item.id}><span className={`dash-activity-icon is-${item.kind}`}>{item.kind === "user" ? <Users size={16} /> : item.title.includes("deposit") ? <ArrowDownLeft size={16} /> : item.title.includes("withdrawal") ? <ArrowUpFromLine size={16} /> : item.title.includes("profit") ? <ChartNoAxesCombined size={16} /> : <Activity size={16} />}</span><div className="dash-row-main"><strong>{item.title}</strong><span>{item.description}</span></div><span className={`dash-badge ${["COMPLETED", "VERIFIED", "Active"].includes(item.status) ? "is-positive" : ""}`}>{item.status}</span><time><Clock3 size={12} />{relativeTime(item.createdAt)}</time></div>)}</div> : <div className="dash-empty-state"><Activity size={21} /><strong>No recent activity</strong><span>New registrations and recorded transactions will appear here.</span></div>}
        </section>

        <section className="dash-panel dash-transactions">
          <div className="dash-section-head"><div><h2>Latest transactions</h2><p>Recent ledger activity</p></div><Link href="/dashboard/transactions">View all <ArrowRight size={14} /></Link></div>
          {overview.transactions.length ? <div className="dash-row-list">{overview.transactions.map((transaction) => <div className="dash-transaction-row" key={transaction.id}><span className={`dash-transaction-icon is-${transaction.type.toLowerCase()}`}>{transaction.type === "DEPOSIT" ? <ArrowDownLeft size={16} /> : transaction.type === "WITHDRAWAL" ? <ArrowUpRight size={16} /> : <ArrowLeftRight size={16} />}</span><div className="dash-row-main"><strong>{transaction.customer}</strong><span>{transaction.type.replaceAll("_", " ")}{transaction.room ? ` · ${transaction.room}` : ""} · {dateLabel(transaction.createdAt)}</span></div><span className="dash-transaction-amount">{money(transaction.amount, transaction.currency)}</span><span className={`dash-badge is-${transaction.status.toLowerCase()}`}>{transaction.status}</span></div>)}</div> : <div className="dash-empty-state"><Wallet size={21} /><strong>No transaction records</strong><span>Records entered by an administrator will appear here.</span></div>}
        </section>

        <section className="dash-panel dash-top-room">
          <div className="dash-section-head"><div><h2>Top-performing room</h2><p>Based on recorded profit</p></div></div>
          {overview.topRoom ? <><div className="dash-top-room-mark"><ChartNoAxesCombined size={25} /><span>{overview.topRoom.name}</span></div><strong className="dash-room-profit">{money(overview.topRoom.profit, overview.topRoom.currency)}</strong><p className="dash-muted">Completed profit · {overview.topRoom.currency}</p><Link className="dash-view-room" href={`/dashboard/rooms/${overview.topRoom.slug}`}>View room <ArrowRight size={14} /></Link></> : <div className="dash-empty-state"><ChartNoAxesCombined size={21} /><strong>No room performance data</strong><span>Profit entries need a room and currency to compare performance.</span></div>}
        </section>
      </div>
    </div>
  );
}