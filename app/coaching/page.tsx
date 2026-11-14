import type { Metadata } from "next";
import TradingPageShell from "../../src/components/TradingPageShell";
import { CoachingBookingForm } from "../../src/components/TradingServiceForms";
import { COACHING_PLANS, formatMoneyDh, type CoachingPlanCode } from "../../src/trading";

export const metadata: Metadata = {
  title: "Online Coaching | Ayoub Trader",
  description: "Reserve a recurring monthly online trading-coaching schedule with Ayoub Trader.",
};

export default function CoachingPage() {
  return (
    <TradingPageShell
      kicker="One-to-one coaching"
      title="A recurring hour for your progress."
      description="Select a plan, starting date, and one daily start time. The same appointment repeats for every required day of your month, pending availability and manual confirmation."
    >
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal">Monthly plans · online video sessions</p>
        <div className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
          {(Object.keys(COACHING_PLANS) as CoachingPlanCode[]).map((code) => {
            const plan = COACHING_PLANS[code];
            return (
              <article key={code} className="grid gap-3 py-6 sm:grid-cols-[minmax(8rem,.7fr)_1fr_auto] sm:items-start">
                <div><h2 className="font-display text-2xl font-extrabold uppercase">{plan.name}</h2><p className="mt-1 text-xs text-ink/55">{plan.durationMinutes / 60} {plan.durationMinutes === 60 ? "hour" : "hours"} daily · {plan.cadence === "DAILY" ? "every day" : "Monday–Friday"}</p></div>
                <ul className="space-y-1 text-xs leading-5 text-ink/70">{plan.benefits.map((benefit) => <li key={benefit}><span className="mr-2 text-signal">+</span>{benefit}</li>)}</ul>
                <p className="font-display text-2xl font-extrabold text-signal">{formatMoneyDh(plan.priceDh)}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-6 border-l-2 border-signal bg-cloud px-4 py-4 text-xs leading-5 text-ink/70"><strong className="text-ink">Premium meetings:</strong> in-person meetings in the customer’s city are exclusive to the 5,000 DH Premium plan. Dates and travel arrangements are agreed after manual review.</div>
        <p className="mt-5 text-xs leading-5 text-ink/50">Recurring times use Morocco time. Monthly reservations check every required day as one booking. Payments are made outside this website, and the subscription is activated manually after payment verification.</p>
      </section>

      <section className="self-start border border-ink/10 bg-white p-5 md:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Recurring reservation</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold uppercase">Choose your month</h2>
        <CoachingBookingForm />
      </section>
    </TradingPageShell>
  );
}