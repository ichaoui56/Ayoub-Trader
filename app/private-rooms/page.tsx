import type { Metadata } from "next";
import TradingPageShell from "../../src/components/TradingPageShell";
import { PrivateRoomsForm } from "../../src/components/TradingServiceForms";

export const metadata: Metadata = {
  title: "Private Rooms | Ayoub Trader",
  description: "Apply for Ayoub Trader private-room access. Broker deposits and the membership fee are verified manually.",
};

function safeHttpsUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export default function PrivateRoomsPage() {
  const referralUrl = safeHttpsUrl(process.env.AYOUB_BROKER_REFERRAL_URL);
  return (
    <TradingPageShell
      kicker="Private rooms"
      title="A focused trading community."
      description="Register with Ayoub’s broker referral, submit a deposit screenshot, and request access. Each application and payment is reviewed by Ayoub before VIP access is granted."
    >
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal">How access works</p>
        <ol className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
          <li className="grid grid-cols-[2.5rem_1fr] gap-3 py-5"><span className="font-display text-sm font-bold text-signal">01</span><span><strong className="block text-sm">Register through the referral link</strong><span className="mt-1 block text-xs leading-5 text-ink/60">Your broker account remains with the broker. The referral link must be configured by Ayoub.</span>{referralUrl ? <a href={referralUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex font-bold text-signal underline underline-offset-4">Open broker registration ↗</a> : <span className="mt-3 block text-xs font-semibold text-amber-800">Broker referral link is not configured yet.</span>}</span></li>
          <li className="grid grid-cols-[2.5rem_1fr] gap-3 py-5"><span className="font-display text-sm font-bold text-signal">02</span><span><strong className="block text-sm">Submit your deposit proof</strong><span className="mt-1 block text-xs leading-5 text-ink/60">Upload a screenshot with this private request form. The file is stored privately and is not published to a public image service.</span></span></li>
          <li className="grid grid-cols-[2.5rem_1fr] gap-3 py-5"><span className="font-display text-sm font-bold text-signal">03</span><span><strong className="block text-sm">Pay $80 for two months</strong><span className="mt-1 block text-xs leading-5 text-ink/60">Payment happens outside this website. Ayoub records and verifies it manually.</span></span></li>
          <li className="grid grid-cols-[2.5rem_1fr] gap-3 py-5"><span className="font-display text-sm font-bold text-signal">04</span><span><strong className="block text-sm">Wait for manual VIP approval</strong><span className="mt-1 block text-xs leading-5 text-ink/60">Access is granted only after both the broker deposit and membership payment are verified.</span></span></li>
        </ol>
        <p className="mt-5 text-xs leading-5 text-ink/50">A broker deposit is not the $80 membership payment. Never send broker passwords, API keys, or recovery codes with a proof screenshot.</p>
      </section>

      <section className="self-start border border-ink/10 bg-white p-5 md:p-7">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Membership</p><h2 className="mt-2 font-display text-3xl font-extrabold uppercase">Private rooms</h2></div><p className="font-display text-3xl font-extrabold">$80</p></div>
        <p className="mt-4 text-sm text-ink/60">Two-month period · paid outside the website</p>
        <PrivateRoomsForm referralReady={Boolean(referralUrl)} />
      </section>
    </TradingPageShell>
  );
}