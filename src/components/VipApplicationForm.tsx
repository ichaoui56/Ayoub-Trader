"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Check, ExternalLink, Landmark, ShieldCheck } from "lucide-react";
import { submitVipApplication, type VipRequestActionState } from "../server/vip-actions";

type Settings = {
  brokerName: string;
  brokerLogo: string;
  brokerReferralUrl: string;
  depositRequirements: string;
  ownBrokerPrice: string;
  ownBrokerCurrency: string;
  ownBrokerPaymentInstructions: string;
};

const initialState: VipRequestActionState = { success: false, message: "" };

export default function VipApplicationForm({ settings }: { settings: Settings }) {
  const [option, setOption] = useState("OUR_BROKER");
  const [state, action, pending] = useActionState(submitVipApplication, initialState);
  return (
    <div className="space-y-7">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#087a2f]">Choose your route</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold uppercase">Apply for access</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68736a]">Both options include two calendar months of membership. Every application and proof is checked manually before access is activated.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Select a broker option">
        <button type="button" role="radio" aria-checked={option === "OUR_BROKER"} onClick={() => setOption("OUR_BROKER")} className={`min-h-28 border p-5 text-left transition ${option === "OUR_BROKER" ? "border-[#087a2f] bg-white ring-1 ring-[#087a2f]" : "border-[#172019]/15 bg-white/60 hover:bg-white"}`}>
          <span className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-sm font-bold"><Landmark size={17} /> Our Broker</span>{option === "OUR_BROKER" && <Check size={17} className="text-[#087a2f]" />}</span>
          <span className="mt-3 block text-xs leading-5 text-[#68736a]">Use our referral link, complete the required deposit, then send your screenshot through WhatsApp.</span>
        </button>
        <button type="button" role="radio" aria-checked={option === "OWN_BROKER"} onClick={() => setOption("OWN_BROKER")} className={`min-h-28 border p-5 text-left transition ${option === "OWN_BROKER" ? "border-[#087a2f] bg-white ring-1 ring-[#087a2f]" : "border-[#172019]/15 bg-white/60 hover:bg-white"}`}>
          <span className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-sm font-bold"><ShieldCheck size={17} /> Own Broker</span>{option === "OWN_BROKER" && <Check size={17} className="text-[#087a2f]" />}</span>
          <span className="mt-3 block text-xs leading-5 text-[#68736a]">Keep your current broker. Membership is {settings.ownBrokerCurrency} {Number(settings.ownBrokerPrice).toFixed(2)} for two months.</span>
        </button>
      </div>

      <section className="border-l-2 border-[#b8a46e] bg-white px-5 py-5 sm:px-6">
        {option === "OUR_BROKER" ? <>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#68736a]">Our Broker · Two months</p>
          <h3 className="mt-2 font-display text-2xl font-extrabold uppercase">{settings.brokerName}</h3>
          {settings.brokerLogo && <img className="mt-3 h-12 max-w-40 object-contain object-left" src={settings.brokerLogo} alt={`${settings.brokerName} logo`} />}
          <p className="mt-2 text-sm leading-6 text-[#68736a]">{settings.depositRequirements}</p>
          {settings.brokerReferralUrl ? <a className="mt-4 inline-flex min-h-10 items-center gap-2 border border-[#172019]/15 px-3 text-xs font-bold" href={settings.brokerReferralUrl} target="_blank" rel="noreferrer">Open broker referral <ExternalLink size={14} /></a> : <p className="mt-4 text-xs font-semibold text-red-800">The broker referral link is not configured.</p>}
        </> : <>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#68736a]">Own Broker · Two months</p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3"><h3 className="font-display text-2xl font-extrabold uppercase">Manual payment</h3><span className="font-display text-3xl font-extrabold">{settings.ownBrokerCurrency} {Number(settings.ownBrokerPrice).toFixed(2)}</span></div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#68736a]">{settings.ownBrokerPaymentInstructions || "Payment instructions are being configured. Please check back soon or contact support."}</p>
        </>}
        <p className="mt-4 border-t border-[#172019]/10 pt-4 text-xs leading-5 text-[#68736a]">After submitting, use the WhatsApp link to include your Client ID and Application ID. Attach your proof manually. Reporting that you sent proof does not verify payment or eligibility.</p>
      </section>

      <form action={action}>
        <input type="hidden" name="brokerOption" value={option} />
        {state.message && <div className={`mb-4 border-l-2 px-4 py-3 text-sm leading-5 ${state.success ? "border-[#087a2f] bg-[#087a2f]/5" : "border-red-700 bg-red-50 text-red-900"}`} role={state.success ? "status" : "alert"}><p>{state.message}</p>{state.reference && <p className="mt-1 font-mono text-xs">Application ID: {state.reference}</p>}{state.whatsappUrl && <a className="mt-3 inline-flex min-h-10 items-center gap-2 font-bold text-[#087a2f] underline underline-offset-4" href={state.whatsappUrl} target="_blank" rel="noreferrer">Continue in WhatsApp <ExternalLink size={14} /></a>}</div>}
        <button className="inline-flex min-h-12 items-center gap-3 bg-[#172019] px-5 text-sm font-bold text-white transition hover:bg-[#087a2f] disabled:cursor-wait disabled:opacity-50" type="submit" disabled={pending || (option === "OUR_BROKER" && !settings.brokerReferralUrl) || (option === "OWN_BROKER" && !settings.ownBrokerPaymentInstructions)}>{pending ? "Submitting…" : "Submit VIP application"}<ArrowRight size={16} /></button>
      </form>
    </div>
  );
}