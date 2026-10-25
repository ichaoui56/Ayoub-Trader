import Link from "next/link";
import { ALT, MEDIA } from "../content";

export default function Photography() {
  return (
    <section id="why" className="px-5 pb-20 pt-24 md:px-[4vw] md:pb-32 md:pt-36">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/20 pb-4 text-sm">
        <p>01 / A world of connections</p>
        <Link href="#perspective" className="font-semibold hover:text-signal">Explore the bigger picture ↘</Link>
      </div>

      <h2 className="mt-10 max-w-[18ch] font-display text-[clamp(2.4rem,7.4vw,7.5rem)] font-extrabold uppercase leading-[0.92] tracking-tight">
        The world doesn’t move in straight lines.
      </h2>
      <p className="mt-6 max-w-md text-lg">
        Your freight plan should see around the corners. A connected perspective, from the departure point to the final handoff.
      </p>

      <div className="mt-14 grid gap-10 md:grid-cols-12 md:gap-6">
        <figure className="md:col-span-7">
          <img src={MEDIA.terminal} alt={ALT.terminal} loading="lazy" decoding="async" sizes="(min-width: 768px) 58vw, 100vw" className="aspect-[4/3] w-full object-cover md:aspect-[5/4]" />
          <figcaption className="mt-3 flex justify-between gap-4 text-sm"><span>01 / Beyond the horizon</span><span>Ocean connections ↗</span></figcaption>
        </figure>
        <figure className="md:col-span-4 md:col-start-9 md:mt-40">
          <img src={MEDIA.port} alt={ALT.port} loading="lazy" decoding="async" sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[4/5] w-full object-cover" />
          <figcaption className="mt-3 text-sm">Different scales.<br />The same attention to detail.</figcaption>
        </figure>
      </div>
    </section>
  );
}
