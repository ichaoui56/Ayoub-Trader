import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Logo from "../../../../components/Logo";
import VipAuthForms from "../../../../components/VipAuthForms";
import { getActiveAdmin } from "../../../../server/dashboard-auth";
import { getVipClient } from "../../../../server/vip-auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function VipLoginPage() {
  if (await getActiveAdmin()) redirect("/dashboard");
  if (await getVipClient()) redirect("/app");
  return (
    <main className="auth-screen">
      <div className="auth-market-grid" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /></div>
      <section className="auth-panel">
        <Logo href="/vip/login" className="auth-logo" />
        <VipAuthForms />
      </section>
      <aside className="auth-aside" aria-label="Trading platform">
        <div className="auth-aside-copy"><span className="eyebrow">PRIVATE TRADING PLATFORM</span><h2>Trade with<br /><strong>discipline.</strong></h2><p>One secure entry for your account and trading operations.</p></div>
        <div className="auth-chart" aria-hidden="true"><div className="auth-chart-label">MARKET PATTERN <span>ILLUSTRATIVE</span></div><div className="auth-candles">{[35, 54, 43, 62, 47, 72, 59, 85, 67, 94, 78, 105, 88, 119, 99, 132, 112, 145].map((height, index) => <i key={index} style={{ height, animationDelay: `${index * 35}ms` }} />)}</div><div className="auth-chart-footer"><span>SECURE SESSION</span><span>ENCRYPTED</span></div></div>
      </aside>
    </main>
  );
}