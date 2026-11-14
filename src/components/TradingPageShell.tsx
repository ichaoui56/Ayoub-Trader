import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "./Nav";
import Logo from "./Logo";

export default function TradingPageShell({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav />

      <main>
        <section className="bg-[#07120b] px-5 pb-14 pt-28 text-white md:px-10 md:pb-20 md:pt-36">
          <div className="mx-auto max-w-[1440px]">
            <Link href="/" className="text-xs font-semibold text-white/55 hover:text-[#37d65b]">← Ayoub Trader</Link>
            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.22em] text-[#37d65b]">{kicker}</p>
            <h1 className="mt-3 max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.92] sm:text-6xl md:text-7xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65 md:text-base">{description}</p>
          </div>
        </section>
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)] md:px-10 md:py-16">
          {children}
        </div>
      </main>

      <footer className="bg-[#07120b] px-5 py-7 text-white md:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5">
          <Logo href="/" compact className="brightness-0 invert" />
          <p className="max-w-2xl text-xs leading-5 text-white/50">Trading involves risk. Educational services do not guarantee results. No online payments are processed through this website.</p>
          <Link href="/dashboard/loginP" className="text-xs font-semibold text-white/65 hover:text-[#37d65b]">Admin sign in</Link>
        </div>
      </footer>
    </div>
  );
}