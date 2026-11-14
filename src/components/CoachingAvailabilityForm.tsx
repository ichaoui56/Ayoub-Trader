"use client";

import { useActionState, useState } from "react";
import { blockCoachingAvailability } from "../server/trading-actions";
import { EMPTY_TRADING_ACTION_STATE } from "../trading";

const inputClass = "mt-2 min-h-11 w-full border border-ink/20 bg-white px-3 text-xs outline-none focus:border-signal focus:ring-2 focus:ring-signal/15";

export default function CoachingAvailabilityForm() {
  const [state, action, pending] = useActionState(blockCoachingAvailability, EMPTY_TRADING_ACTION_STATE);
  const [allDay, setAllDay] = useState(false);
  return (
    <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-xs font-bold">Date<input className={inputClass} name="date" type="date" required /></label>
      <label className="text-xs font-bold">Reason<input className={inputClass} name="reason" maxLength={160} placeholder="Optional" /></label>
      <label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2"><input className="accent-signal" name="allDay" type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />Block the entire date</label>
      {!allDay && <><label className="text-xs font-bold">From<input className={inputClass} name="startTime" type="time" step="900" required /></label><label className="text-xs font-bold">Until<input className={inputClass} name="endTime" type="time" step="900" required /></label></>}
      <button className="min-h-11 bg-ink px-4 text-xs font-bold text-white transition-colors hover:bg-signal disabled:opacity-60 sm:col-span-2" type="submit" disabled={pending}>{pending ? "Saving block…" : "Block this time"}</button>
      {state.message && <p className={`text-xs leading-5 sm:col-span-2 ${state.success ? "text-signal" : "text-red-800"}`} role={state.success ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}