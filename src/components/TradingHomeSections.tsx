import Link from "next/link";
import Logo from "./Logo";
import { COACHING_PLANS, formatMoneyDh, type CoachingPlanCode } from "../trading";

export function TradingCoachingSection() {
  return (
    <section id="coaching" className="bg-cloud">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 md:grid-cols-[.8fr_1.2fr] md:px-10 md:py-24">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-signal">Online video coaching</p><h2 className="mt-3 font-display text-4xl font-extrabold uppercase md:text-6xl">A month of consistent practice.</h2><p className="mt-5 max-w-lg text-sm leading-6 text-ink/65">Reserve one daily start time for your entire subscription. The same schedule repeats across the selected weekdays, subject to availability on every date.</p><Link href="/coaching" className="mt-7 inline-flex min-h-12 items-center bg-ink px-6 text-sm font-bold text-white transition-colors hover:bg-signal">See plans and availability <span className="ml-4" aria-hidden="true">↗</span></Link></div>
        <div className="grid gap-px bg-ink/15 sm:grid-cols-3">
          {(Object.keys(COACHING_PLANS) as CoachingPlanCode[]).map((code) => {
            const plan = COACHING_PLANS[code];
            return <div key={code} className="bg-white p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-signal">{plan.name}</p><p className="mt-5 font-display text-4xl font-extrabold">{formatMoneyDh(plan.priceDh).replace(" DH", "")}<span className="ml-1 text-sm font-semibold">DH</span></p><p className="mt-4 border-t border-ink/10 pt-4 text-sm font-semibold">{plan.durationMinutes / 60} {plan.durationMinutes === 60 ? "hour" : "hours"} daily</p><p className="mt-1 text-xs text-ink/55">{plan.cadence === "DAILY" ? "Every day" : "Mon-Fri"} · one month</p></div>;
          })}
        </div>
      </div>
    </section>
  );
}

export function TradingHomeFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-6 bg-[#07120b] px-5 py-8 text-white md:px-10">
      <Logo href="#top" className="brightness-0 invert" compact />
      <p className="max-w-2xl text-xs leading-5 text-white/50">Educational services only. Trading carries significant risk and may not be suitable for every investor. No returns are promised.</p>
      <Link href="/dashboard/loginP" className="text-xs font-semibold text-white/65 hover:text-[#37d65b]">Admin sign in</Link>
    </footer>
  );
}