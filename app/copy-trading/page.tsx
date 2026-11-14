import type { Metadata } from "next";
import TradingPageShell from "../../src/components/TradingPageShell";
import { CopyTradingForm } from "../../src/components/TradingServiceForms";

export const metadata: Metadata = {
  title: "Copy Trading | Ayoub Trader",
  description: "Apply for manually reviewed copy trading through a broker-supported secure authorization flow.",
};

function authorizationIsConfigured(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? true : undefined;
  } catch {
    return undefined;
  }
}

export default function CopyTradingPage() {
  const authorizationConfigured = authorizationIsConfigured(process.env.AYOUB_BROKER_AUTHORIZATION_URL);
  return (
    <TradingPageShell
      kicker="Copy trading"
      title="Connect securely. Keep control."
      description="Apply with a broker account of at least $200. Ayoub reviews each application and activates the service only after the account holder completes broker-supported authorization."
    >
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-signal">Before you apply</p>
        <div className="mt-5 border-y border-ink/10">
          <div className="border-b border-ink/10 py-5"><h2 className="text-sm font-bold">Minimum account balance</h2><p className="mt-1 text-xs leading-5 text-ink/60">Your broker account must hold at least $200. This is your account and remains subject to market risk.</p></div>
          <div className="border-b border-ink/10 py-5"><h2 className="text-sm font-bold">50% profit share</h2><p className="mt-1 text-xs leading-5 text-ink/60">Ayoub receives 50% of generated profits under the service arrangement. No returns are promised, and losses are possible.</p></div>
          <div className="py-5"><h2 className="text-sm font-bold">Broker authorization only</h2><p className="mt-1 text-xs leading-5 text-ink/60">The website and WhatsApp never collect your trading login, password, API key, recovery phrase, or authorization code. A secure broker-supported connection is required before activation.</p></div>
        </div>
        {authorizationConfigured ? <p className="mt-5 border-l-2 border-signal bg-cloud px-4 py-3 text-xs leading-5 text-ink/70">The broker authorization flow is configured. Ayoub will provide the secure connection step after reviewing your application.</p> : <p className="mt-5 border-l-2 border-amber-600 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">Secure broker authorization is not configured yet. Applications can be reviewed, but copy trading cannot be activated. Never send credentials to request access.</p>}
      </section>

      <section className="self-start border border-ink/10 bg-white p-5 md:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Application</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold uppercase">Request a review</h2>
        <p className="mt-3 text-xs leading-5 text-ink/55">No credentials are requested in this form. Your application remains pending until Ayoub reviews it.</p>
        <CopyTradingForm />
      </section>
    </TradingPageShell>
  );
}