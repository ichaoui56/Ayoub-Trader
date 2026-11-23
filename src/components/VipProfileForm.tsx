"use client";

import { useActionState } from "react";
import { updateVipProfile, type VipProfileActionState } from "../server/vip-actions";

const initialState: VipProfileActionState = { success: false, message: "" };
const inputClass = "mt-2 min-h-11 w-full border border-[#172019]/15 bg-white px-3 text-sm outline-none focus:border-[#087a2f] focus:ring-2 focus:ring-[#087a2f]/10";
const labelClass = "block text-xs font-semibold text-[#465248]";

export default function VipProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState(updateVipProfile, initialState);
  return <form action={action} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>Full name<input className={inputClass} name="name" defaultValue={name} maxLength={120} required /></label>
      <label className={labelClass}>WhatsApp number<input className={inputClass} name="phone" type="tel" defaultValue={phone} maxLength={40} required /></label>
    </div>
    <div className="border-t border-[#172019]/10 pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#68736a]">Security</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className={labelClass}>Current password<input className={inputClass} name="currentPassword" type="password" autoComplete="current-password" required /></label><label className={labelClass}>New password <span className="font-normal text-[#68736a]">(optional)</span><input className={inputClass} name="newPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} /></label></div><p className="mt-2 text-[10px] text-[#68736a]">Leave new password empty to keep your current password.</p></div>
    {state.message && <p className={`border-l-2 px-4 py-3 text-sm ${state.success ? "border-[#087a2f] bg-[#087a2f]/5" : "border-red-700 bg-red-50 text-red-900"}`} role={state.success ? "status" : "alert"}>{state.message}</p>}
    <button className="min-h-11 bg-[#172019] px-5 text-xs font-bold text-white transition hover:bg-[#087a2f] disabled:opacity-50" type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
  </form>;
}