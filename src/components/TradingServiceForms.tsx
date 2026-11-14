"use client";

import { useActionState, useState } from "react";
import {
  submitCoachingBooking,
  submitCopyTradingApplication,
  submitPrivateRoomRequest,
} from "../server/trading-actions";
import {
  COACHING_PLANS,
  EMPTY_TRADING_ACTION_STATE,
  formatMoneyDh,
  type CoachingPlanCode,
  type TradingActionState,
} from "../trading";

const fieldClass = "mt-2 min-h-12 w-full border border-ink/20 bg-white px-3 text-sm text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/15";
const labelClass = "block text-xs font-bold text-ink";

function RequestStatus({ state }: { state: TradingActionState }) {
  if (!state.message) return null;
  return (
    <div role={state.success ? "status" : "alert"} className={`mt-5 border-l-2 px-4 py-3 text-sm leading-6 ${state.success ? "border-signal bg-cloud" : "border-red-600 bg-red-50 text-red-900"}`}>
      <p>{state.message}</p>
      {state.reference && <p className="mt-1 text-xs font-semibold">Reference: <span className="font-mono">{state.reference}</span></p>}
      {state.success && state.whatsappUrl && <a className="mt-3 inline-flex font-bold text-signal underline underline-offset-4" href={state.whatsappUrl} target="_blank" rel="noreferrer">Confirm with Ayoub on WhatsApp ↗</a>}
    </div>
  );
}

function CustomerFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>Full name<input className={fieldClass} name="customerName" autoComplete="name" maxLength={120} required /></label>
      <label className={labelClass}>WhatsApp number<input className={fieldClass} name="customerPhone" type="tel" autoComplete="tel" placeholder="+212 …" maxLength={40} required /></label>
      <label className={`${labelClass} sm:col-span-2`}>Email address <span className="font-normal text-ink/45">(optional)</span><input className={fieldClass} name="customerEmail" type="email" autoComplete="email" maxLength={254} /></label>
    </div>
  );
}

function Honeypot() {
  return <label aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>;
}

export function PrivateRoomsForm({ referralReady }: { referralReady: boolean }) {
  const [state, action, pending] = useActionState(submitPrivateRoomRequest, EMPTY_TRADING_ACTION_STATE);
  return (
    <form action={action} className="relative border-t-2 border-signal pt-6">
      <Honeypot />
      <CustomerFields />
      <label className={`${labelClass} mt-5 block`}>Broker deposit screenshot
        <input className={`${fieldClass} file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-bold file:text-white`} name="depositProof" type="file" accept="image/jpeg,image/png,image/webp" required />
        <span className="mt-2 block text-xs font-normal leading-5 text-ink/55">JPG, PNG or WebP, up to 5 MB. This proof is private and visible only to the administrator.</span>
      </label>
      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-ink/65"><input className="mt-1 accent-signal" name="registered" type="checkbox" required /><span>I registered with the broker using Ayoub’s referral link and this screenshot shows my deposit.</span></label>
      <button className="mt-6 min-h-12 w-full bg-signal px-5 text-sm font-bold text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={pending || !referralReady}>{pending ? "Submitting request…" : referralReady ? "Submit for manual review" : "Referral link required"}</button>
      {!referralReady && <p className="mt-3 text-xs leading-5 text-amber-900">Ayoub’s broker referral link must be configured before private-room requests can be submitted.</p>}
      <p className="mt-3 text-xs leading-5 text-ink/50">The $80 membership fee is paid separately. Neither VIP access nor membership is activated until Ayoub verifies the deposit and fee.</p>
      <RequestStatus state={state} />
    </form>
  );
}

export function CopyTradingForm() {
  const [state, action, pending] = useActionState(submitCopyTradingApplication, EMPTY_TRADING_ACTION_STATE);
  return (
    <form action={action} className="relative border-t-2 border-signal pt-6">
      <Honeypot />
      <CustomerFields />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>Broker name<input className={fieldClass} name="brokerName" maxLength={120} required /></label>
        <label className={labelClass}>Account balance in USD<input className={fieldClass} name="accountBalance" type="number" min="200" max="100000000" step="0.01" defaultValue="200" required /><span className="mt-2 block text-xs font-normal text-ink/50">Minimum $200</span></label>
      </div>
      <div className="mt-5 border border-ink/15 bg-cloud p-4 text-xs leading-5 text-ink/70">
        <p className="font-bold text-ink">Never enter your trading login, password, API key, or authorization code here or in WhatsApp.</p>
        <p className="mt-2">After manual review, connect only through the broker’s secure authorization flow. This application form does not collect credentials.</p>
      </div>
      <button className="mt-6 min-h-12 w-full bg-signal px-5 text-sm font-bold text-white transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-60" type="submit" disabled={pending}>{pending ? "Submitting application…" : "Apply for copy trading"}</button>
      <p className="mt-3 text-xs leading-5 text-ink/50">Ayoub reviews and activates every application manually. Profit share is 50% of generated profits; losses and trading risk remain with the account holder.</p>
      <RequestStatus state={state} />
    </form>
  );
}

const weekdays = [
  { label: "M", day: 1 },
  { label: "T", day: 2 },
  { label: "W", day: 3 },
  { label: "T", day: 4 },
  { label: "F", day: 5 },
  { label: "S", day: 6 },
  { label: "S", day: 0 },
];

export function CoachingBookingForm() {
  const [planCode, setPlanCode] = useState<CoachingPlanCode>("STARTER");
  const [state, action, pending] = useActionState(submitCoachingBooking, EMPTY_TRADING_ACTION_STATE);
  const plan = COACHING_PLANS[planCode];
  return (
    <form action={action} className="relative border-t-2 border-signal pt-6">
      <Honeypot />
      <label className={labelClass}>Coaching plan
        <select className={fieldClass} name="package" value={planCode} onChange={(event) => setPlanCode(event.target.value as CoachingPlanCode)}>
          {(Object.keys(COACHING_PLANS) as CoachingPlanCode[]).map((code) => <option key={code} value={code}>{COACHING_PLANS[code].name} · {formatMoneyDh(COACHING_PLANS[code].priceDh)}</option>)}
        </select>
      </label>

      <div className="mt-5 grid grid-cols-7 border border-ink/10 bg-white" aria-label="Illustrative weekly recurring schedule">
        {weekdays.map(({ label, day }, index) => {
          const active = plan.days.some((scheduledDay) => scheduledDay === day);
          return <div key={`${label}-${index}`} className={`border-r border-ink/10 py-3 text-center last:border-r-0 ${active ? "bg-cloud text-signal" : "text-ink/30"}`}><span className="block text-[10px] font-bold uppercase">{label}</span><span className="mt-2 block h-1 w-1/2 mx-auto bg-current opacity-65" /></div>;
        })}
      </div>
      <p className="mt-2 text-xs leading-5 text-ink/50">Illustrative weekly repeat. Your selected start time is reserved for every required day in the month.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>Starting date<input className={fieldClass} name="startDate" type="date" required /></label>
        <label className={labelClass}>Daily start time<input className={fieldClass} name="startTime" type="time" step="900" required /><span className="mt-2 block text-xs font-normal text-ink/50">Morocco time · 15-minute intervals</span></label>
      </div>
      <div className="mt-5 grid gap-4">
        <CustomerFields />
      </div>

      <div className="mt-5 border border-ink/10 bg-cloud p-4">
        <div className="flex items-baseline justify-between gap-3"><h3 className="font-display text-xl font-extrabold uppercase">{plan.name} · one month</h3><span className="font-display text-2xl font-extrabold text-signal">{formatMoneyDh(plan.priceDh)}</span></div>
        <p className="mt-2 text-xs text-ink/60">{plan.durationMinutes / 60} {plan.durationMinutes === 60 ? "hour" : "hours"} daily · {plan.cadence === "DAILY" ? "every day" : "Monday–Friday"}</p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">{plan.benefits.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul>
      </div>
      <button className="mt-6 min-h-12 w-full bg-signal px-5 text-sm font-bold text-white transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-60" type="submit" disabled={pending}>{pending ? "Checking the month…" : "Check and reserve recurring time"}</button>
      <p className="mt-3 text-xs leading-5 text-ink/50">Every date in the monthly schedule is checked together. If any session conflicts, nothing is reserved and you can choose another time. Payment is handled outside the website; a request is not an activation.</p>
      <RequestStatus state={state} />
    </form>
  );
}