import Link from "next/link";
import Logo from "./Logo";
import {
  completeCoachingSession,
  grantPrivateRoomVip,
  recordCopyTradingProfitShare,
  removeCoachingAvailabilityBlock,
  reviewManualPayment,
  reviewPrivateRoomDeposit,
  updateCoachingBookingStatus,
  updateCopyTradingStatus,
} from "../server/trading-actions";
import { signOutTransferDashboard } from "../server/transfer-actions";
import type { TradingDashboardData } from "../server/trading-data";
import { minuteToTime } from "../trading";
import CoachingAvailabilityForm from "./CoachingAvailabilityForm";
import VipManagement from "./VipManagement";
import DownloadPrivateRoomProof from "./DownloadPrivateRoomProof";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}

function whatsappHref(phone: string, message: string) {
  const number = phone.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function Status({ value }: { value: string }) {
  const isPositive = ["VIP_ACTIVE", "ACTIVE", "VERIFIED", "COMPLETED", "AUTHORIZED"].includes(value);
  const isNegative = ["REJECTED", "CANCELLED", "EXPIRED", "PAUSED"].includes(value);
  return <span className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${isPositive ? "border-signal/30 bg-cloud text-signal" : isNegative ? "border-red-900/15 bg-red-50 text-red-800" : "border-ink/15 bg-white text-ink/60"}`}>{value.replaceAll("_", " ")}</span>;
}

function HiddenId({ id }: { id: string }) {
  return <input type="hidden" name="id" value={id} />;
}

function WhatsApp({ phone, service }: { phone: string; service: string }) {
  return <a className="font-semibold text-signal underline underline-offset-4" href={whatsappHref(phone, `Hello Ayoub, I am following up about my ${service} request.`)} target="_blank" rel="noreferrer">WhatsApp ↗</a>;
}

function SectionHeading({ id, index, title, count }: { id: string; index: string; title: string; count: number }) {
  return <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/15 pb-3"><h2 id={id} className="font-display text-3xl font-extrabold uppercase"><span className="mr-3 text-sm text-signal">{index}</span>{title}</h2><span className="text-xs text-ink/50">{count} records</span></div>;
}

export default function TradingDashboard({
  data,
  vipData,
  username,
  authorizationConfigured,
}: {
  data: TradingDashboardData;
  vipData: Awaited<ReturnType<typeof import("../server/vip-admin-data").getVipAdminData>>;
  username: string;
  authorizationConfigured: boolean;
}) {
  const pendingPayments = data.payments.filter((payment) => payment.status === "PENDING").length;
  const activeCoaching = data.coaching.filter((booking) => booking.status === "ACTIVE").length;
  return (
    <main className="min-h-screen bg-[#f5faf6] text-ink">
      <header className="border-b border-white/10 bg-[#07120b] text-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-5 px-5 py-4 md:px-8">
          <div className="flex items-center gap-5"><Logo href="/" compact className="brightness-0 invert" /><div className="border-l border-white/20 pl-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#37d65b]">Ayoub Trader</p><p className="mt-1 text-xs text-white/65">Operations dashboard</p></div></div>
          <div className="flex items-center gap-4"><span className="hidden text-xs text-white/60 sm:inline">Signed in as {username}</span><Link href="/" className="text-xs font-semibold text-white/70 hover:text-[#37d65b]">View website</Link><form action={signOutTransferDashboard}><button className="min-h-10 border border-white/25 px-3 text-xs font-bold hover:border-signal hover:text-[#37d65b]">Sign out</button></form></div>
        </div>
      </header>

      <div className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur">
        <nav aria-label="Dashboard modules" className="mx-auto flex max-w-[1600px] gap-5 overflow-x-auto px-5 py-3 text-xs font-bold whitespace-nowrap md:px-8">
          {["customers", "private-rooms", "vip-management", "copy-trading", "coaching", "reservations", "availability", "payments"].map((id) => <a key={id} href={`#${id}`} className="capitalize text-ink/60 transition-colors hover:text-signal">{id.replaceAll("-", " ")}</a>)}
        </nav>
      </div>

      <div className="mx-auto max-w-[1600px] px-5 py-8 md:px-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-ink/15 pb-6">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal">Trading services</p><h1 className="mt-2 font-display text-4xl font-extrabold uppercase md:text-5xl">Review & manage</h1></div>
          <p className="max-w-lg text-xs leading-5 text-ink/55">Requests remain pending until you verify payment and take an explicit activation action. Copy-trading credentials are never stored here.</p>
        </div>

        <div className="grid grid-cols-2 border-b border-ink/15 sm:grid-cols-4">
          {[{ label: "Customers", value: data.customers.length }, { label: "Private room requests", value: data.privateRooms.length }, { label: "Copy applications", value: data.copyTrading.length }, { label: "Payments to verify", value: pendingPayments }, { label: "Coaching reservations", value: data.coaching.length }, { label: "Active coaching", value: activeCoaching }].map((item) => <div key={item.label} className="border-r border-ink/10 py-5 pr-4 last:border-r-0 sm:px-5 first:sm:pl-0"><p className="text-[10px] font-bold uppercase tracking-wide text-ink/45">{item.label}</p><p className="mt-2 font-display text-3xl font-extrabold">{item.value}</p></div>)}
        </div>

        <section className="py-10">
          <SectionHeading id="customers" index="01" title="Customers" count={data.customers.length} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-ink/45"><tr><th className="py-3 pr-4">Customer</th><th className="py-3 pr-4">Phone</th><th className="py-3 pr-4">Email</th><th className="py-3 pr-4">First request</th><th className="py-3">Contact</th></tr></thead><tbody className="divide-y divide-ink/10">{data.customers.map((customer) => <tr key={customer.id}><td className="py-3 pr-4 font-semibold">{customer.name}</td><td className="py-3 pr-4">{customer.phone}</td><td className="py-3 pr-4 text-ink/55">{customer.email || "—"}</td><td className="py-3 pr-4">{dateLabel(customer.createdAt.slice(0, 10))}</td><td className="py-3"><WhatsApp phone={customer.phone} service="trading" /></td></tr>)}</tbody></table>
            {!data.customers.length && <p className="py-6 text-sm text-ink/50">No customer records yet.</p>}
          </div>
        </section>

        <section className="border-t border-ink/15 py-10">
          <SectionHeading id="private-rooms" index="02" title="Private rooms" count={data.privateRooms.length} />
          <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-ink/45"><tr><th className="py-3 pr-4">Customer</th><th className="py-3 pr-4">Submitted</th><th className="py-3 pr-4">Deposit proof</th><th className="py-3 pr-4">Request</th><th className="py-3 pr-4">$80 payment</th><th className="py-3">Actions</th></tr></thead><tbody className="divide-y divide-ink/10">{data.privateRooms.map((request) => {
            const payment = request.payments[0];
            return <tr key={request.id}>
              <td className="py-4 pr-4"><strong className="block">{request.customer.name}</strong><span className="mt-1 block text-ink/50">{request.customer.phone}</span><span className="mt-2 block"><WhatsApp phone={request.customer.phone} service="private rooms" /></span></td>
              <td className="py-4 pr-4">{dateLabel(request.createdAt.slice(0, 10))}</td>
              <td className="py-4 pr-4">{request.hasDepositProof ? <DownloadPrivateRoomProof id={request.id} /> : "Missing"}</td>
              <td className="py-4 pr-4"><Status value={request.status} /></td>
              <td className="py-4 pr-4">{payment ? <Status value={payment.status} /> : "No record"}</td>
              <td className="py-4"><div className="flex flex-wrap gap-2">{request.status === "SUBMITTED" && <><form action={reviewPrivateRoomDeposit}><HiddenId id={request.id} /><button name="decision" value="verify" className="min-h-9 bg-signal px-3 font-bold text-white">Verify deposit</button></form><form action={reviewPrivateRoomDeposit}><HiddenId id={request.id} /><button name="decision" value="reject" className="min-h-9 border border-ink/20 px-3 font-bold">Reject</button></form></>}{request.status === "DEPOSIT_VERIFIED" && payment?.status === "VERIFIED" && <form action={grantPrivateRoomVip}><HiddenId id={request.id} /><button className="min-h-9 bg-ink px-3 font-bold text-white">Grant 2-month VIP</button></form>}</div>{request.vipExpiresAt && <p className="mt-2 text-[10px] text-ink/50">VIP expiry: {dateLabel(request.vipExpiresAt.slice(0, 10))}</p>}</td>
            </tr>;
          })}</tbody></table>{!data.privateRooms.length && <p className="py-6 text-sm text-ink/50">No private-room requests.</p>}</div>
        </section>

        <section className="border-t border-ink/15 py-10">
          <SectionHeading id="copy-trading" index="03" title="Copy trading" count={data.copyTrading.length} />
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-ink/45"><tr><th className="py-3 pr-4">Customer</th><th className="py-3 pr-4">Broker</th><th className="py-3 pr-4">Balance</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Submitted</th><th className="py-3">Review actions</th></tr></thead><tbody className="divide-y divide-ink/10">{data.copyTrading.map((application) => <tr key={application.id}>
            <td className="py-4 pr-4"><strong className="block">{application.customer.name}</strong><span className="mt-1 block text-ink/50">{application.customer.phone}</span><span className="mt-2 block"><WhatsApp phone={application.customer.phone} service="copy trading" /></span></td><td className="py-4 pr-4">{application.brokerName}</td><td className="py-4 pr-4">${application.accountBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td><td className="py-4 pr-4"><Status value={application.status} /></td><td className="py-4 pr-4">{dateLabel(application.createdAt.slice(0, 10))}</td>
            <td className="py-4"><div className="flex flex-wrap gap-2">{application.status === "NEW" && <form action={updateCopyTradingStatus}><HiddenId id={application.id} /><button name="status" value="UNDER_REVIEW" className="min-h-9 bg-signal px-3 font-bold text-white">Start review</button></form>}{application.status === "UNDER_REVIEW" && <form action={updateCopyTradingStatus}><HiddenId id={application.id} /><button name="status" value="AUTHORIZATION_PENDING" className="min-h-9 border border-ink/20 px-3 font-bold">Request secure authorization</button></form>}{application.status === "AUTHORIZATION_PENDING" && authorizationConfigured && <form action={updateCopyTradingStatus}><HiddenId id={application.id} /><button name="status" value="AUTHORIZED" className="min-h-9 border border-ink/20 px-3 font-bold">Mark broker authorization verified</button></form>}{application.status === "AUTHORIZED" && authorizationConfigured && <form action={updateCopyTradingStatus}><HiddenId id={application.id} /><button name="status" value="ACTIVE" className="min-h-9 bg-ink px-3 font-bold text-white">Activate copy trading</button></form>}{application.status === "ACTIVE" && <><form action={updateCopyTradingStatus}><HiddenId id={application.id} /><button name="status" value="PAUSED" className="min-h-9 border border-ink/20 px-3 font-bold">Pause</button></form><form action={recordCopyTradingProfitShare} className="flex items-center gap-1"><HiddenId id={application.id} /><label className="sr-only" htmlFor={`profit-${application.id}`}>Generated profit amount</label><input id={`profit-${application.id}`} className="min-h-9 w-28 border border-ink/20 px-2" name="grossProfit" type="number" min="0.01" step="0.01" placeholder="Profit" required /><label className="sr-only" htmlFor={`currency-${application.id}`}>Profit currency</label><select id={`currency-${application.id}`} className="min-h-9 border border-ink/20 px-2" name="currency" defaultValue="USD"><option>USD</option><option>EUR</option><option>MAD</option></select><button className="min-h-9 bg-signal px-3 font-bold text-white">Record 50%</button></form></>}</div>{application.status === "AUTHORIZATION_PENDING" && !authorizationConfigured && <p className="mt-2 text-[10px] text-amber-900">Configure a broker-supported authorization flow before approval.</p>}{application.payments.length > 0 && <p className="mt-2 text-[10px] text-ink/50">{application.payments.length} profit-share payment record(s)</p>}</td>
          </tr>)}</tbody></table>{!data.copyTrading.length && <p className="py-6 text-sm text-ink/50">No copy-trading applications.</p>}</div>
          <p className="mt-4 text-xs leading-5 text-ink/50">Never request or store account logins, passwords, API keys, or authorization codes. Verify the customer’s broker authorization through the broker before changing status to authorized.</p>
        </section>

        <section className="border-t border-ink/15 py-10">
          <SectionHeading id="coaching" index="04" title="Coaching subscriptions" count={data.coaching.length} />
          <div className="space-y-4">{data.coaching.map((booking) => {
            const paid = booking.payments.some((payment) => payment.status === "VERIFIED");
            return <article key={booking.id} className="border-y border-ink/10 bg-white px-4 py-5 md:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-signal">{booking.package} · {booking.priceDh.toLocaleString("en-US")} DH</p><h3 className="mt-2 text-sm font-bold">{booking.customer.name} <span className="font-normal text-ink/50">· {booking.customer.phone}</span></h3><p className="mt-2 text-xs text-ink/60">{dateLabel(booking.startDate)} – {dateLabel(booking.endDate)} · {minuteToTime(booking.dailyStartMinute)} Morocco time · {booking.durationMinutes / 60}h daily</p><p className="mt-1 text-xs text-ink/60">{booking.expectedSessions - booking.remainingSessions} completed / {booking.remainingSessions} remaining sessions</p></div>
                <div className="flex flex-wrap items-center gap-2"><Status value={booking.status} /><span className="text-[10px] text-ink/50">Payment {paid ? "verified" : "pending"}</span>{booking.status === "PENDING" && <><form action={updateCoachingBookingStatus}><HiddenId id={booking.id} /><button name="decision" value="confirm" className="min-h-9 border border-ink/20 px-3 text-xs font-bold">Confirm booking</button></form><form action={updateCoachingBookingStatus}><HiddenId id={booking.id} /><button name="decision" value="reject" className="min-h-9 border border-red-900/20 px-3 text-xs font-bold text-red-800">Reject</button></form></>}{["PENDING", "CONFIRMED"].includes(booking.status) && paid && <form action={updateCoachingBookingStatus}><HiddenId id={booking.id} /><button name="decision" value="activate" className="min-h-9 bg-signal px-3 text-xs font-bold text-white">Activate subscription</button></form>}{booking.status === "ACTIVE" && <form action={updateCoachingBookingStatus}><HiddenId id={booking.id} /><button name="decision" value="cancel" className="min-h-9 border border-red-900/20 px-3 text-xs font-bold text-red-800">Cancel subscription</button></form>}<WhatsApp phone={booking.customer.phone} service="coaching" /></div>
              </div>
              <details className="mt-4 border-t border-ink/10 pt-3"><summary className="cursor-pointer text-xs font-bold">Recurring sessions ({booking.sessions.length})</summary><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{booking.sessions.map((session) => <div key={session.id} className="flex items-center justify-between gap-3 border border-ink/10 px-3 py-2 text-xs"><span>{dateLabel(session.date)} · {minuteToTime(session.startMinute)}</span><Status value={session.status} />{session.status === "SCHEDULED" && booking.status === "ACTIVE" && <form action={completeCoachingSession}><HiddenId id={session.id} /><button className="font-bold text-signal underline underline-offset-4">Complete</button></form>}</div>)}</div></details>
            </article>;
          })}{!data.coaching.length && <p className="py-6 text-sm text-ink/50">No coaching reservations.</p>}</div>
        </section>

        <section className="border-t border-ink/15 py-10">
          <SectionHeading id="reservations" index="05" title="Recurring reservations" count={data.coaching.reduce((total, booking) => total + booking.sessions.length, 0)} />
          <p className="mb-5 max-w-3xl text-xs leading-5 text-ink/55">Each booking holds all its listed dates at the same daily start time. Pending and confirmed requests reserve those slots too, preventing simultaneous bookings from overlapping.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-ink/45"><tr><th className="py-3 pr-4">Customer</th><th className="py-3 pr-4">Plan</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Time</th><th className="py-3 pr-4">Session</th><th className="py-3">Booking status</th></tr></thead><tbody className="divide-y divide-ink/10">{data.coaching.flatMap((booking) => booking.sessions.map((session) => <tr key={session.id}><td className="py-3 pr-4">{booking.customer.name}</td><td className="py-3 pr-4">{booking.package}</td><td className="py-3 pr-4">{dateLabel(session.date)}</td><td className="py-3 pr-4">{minuteToTime(session.startMinute)}–{minuteToTime(session.startMinute + booking.durationMinutes)}</td><td className="py-3 pr-4"><Status value={session.status} /></td><td className="py-3"><Status value={booking.status} /></td></tr>))}</tbody></table>{!data.coaching.some((booking) => booking.sessions.length) && <p className="py-6 text-sm text-ink/50">No recurring sessions.</p>}</div>
        </section>

        <section className="border-t border-ink/15 py-10">
          <SectionHeading id="availability" index="06" title="Availability blocks" count={data.blocks.length} />
          <div className="grid gap-8 lg:grid-cols-[minmax(18rem,.7fr)_1.3fr]">
            <div><h3 className="font-display text-xl font-extrabold uppercase">Block a date or time</h3><p className="mt-2 text-xs leading-5 text-ink/55">Times use Africa/Casablanca and 15-minute increments. A block cannot overlap a reserved coaching session or another block.</p><CoachingAvailabilityForm /></div>
            <div className="divide-y divide-ink/10 border-y border-ink/10">{data.blocks.map((block) => <div key={block.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div><strong>{dateLabel(block.date)}</strong><span className="mx-2 text-ink/40">{minuteToTime(block.startMinute)}–{minuteToTime(block.endMinute)}</span><span className="text-ink/50">{block.reason || "Unavailable"}</span></div><form action={removeCoachingAvailabilityBlock}><HiddenId id={block.id} /><button className="font-bold text-signal underline underline-offset-4">Remove block</button></form></div>)}{!data.blocks.length && <p className="py-5 text-xs text-ink/50">No upcoming availability blocks.</p>}</div>
          </div>
        </section>

        <section className="border-t border-ink/15 py-10">
          <SectionHeading id="payments" index="07" title="Manual payments" count={data.payments.length} />
          <p className="mb-4 text-xs text-ink/55">Payments take place outside the website. Verifying a payment records the manual review; service activation remains a separate action.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-ink/45"><tr><th className="py-3 pr-4">Customer</th><th className="py-3 pr-4">Service</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Payment state</th><th className="py-3 pr-4">Submitted</th><th className="py-3">Review</th></tr></thead><tbody className="divide-y divide-ink/10">{data.payments.map((payment) => <tr key={payment.id}><td className="py-3 pr-4">{payment.customer.name}<span className="mt-1 block text-ink/50">{payment.customer.phone}</span></td><td className="py-3 pr-4">{payment.service.replaceAll("_", " ")}</td><td className="py-3 pr-4">{payment.currency} {payment.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td><td className="py-3 pr-4"><Status value={payment.status} /></td><td className="py-3 pr-4">{dateLabel(payment.createdAt.slice(0, 10))}</td><td className="py-3">{payment.status === "PENDING" && <div className="flex gap-2"><form action={reviewManualPayment}><HiddenId id={payment.id} /><button name="decision" value="verify" className="min-h-9 bg-signal px-3 font-bold text-white">Verify payment</button></form><form action={reviewManualPayment}><HiddenId id={payment.id} /><button name="decision" value="reject" className="min-h-9 border border-ink/20 px-3 font-bold">Reject</button></form></div>}<span className="block mt-1"><WhatsApp phone={payment.customer.phone} service="payment" /></span></td></tr>)}</tbody></table>{!data.payments.length && <p className="py-6 text-sm text-ink/50">No manual payment records.</p>}</div>
        </section>
        <VipManagement data={vipData} />
      </div>
    </main>
  );
}