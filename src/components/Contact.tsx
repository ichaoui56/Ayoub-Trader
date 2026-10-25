import Link from "next/link";
import Logo from "./Logo";
import ShipmentBrief from "./ShipmentBrief";

export default function Contact() {
  return (
    <section id="contact" className="bg-paper px-5 pt-24 md:px-[4vw] md:pt-40">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/20 pb-4 text-sm">
        <p>04 / Your next move</p>
        <p>Good journeys start with a conversation.</p>
      </div>
      <h2 className="mt-12 font-display text-[clamp(2.8rem,10.5vw,11rem)] font-extrabold uppercase leading-[0.9] tracking-tight">
        Let’s move something <em className="text-signal">forward.</em>
      </h2>
      <div className="mt-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <p className="max-w-sm text-lg">Tell us what you’re moving.<br />Let’s put the first details<br />in the right place.</p>
        <ShipmentBrief />
      </div>

      <footer className="mt-24 flex flex-col gap-6 border-t border-ink/20 py-8 text-sm md:mt-40 md:flex-row md:items-center md:justify-between">
        <Logo className="on-light" />
        <p className="max-w-md text-ink/75">© 2026 Freight / Forward. Independent design concept. No affiliation with an existing carrier.</p>
        <Link href="#top" className="font-semibold hover:text-signal">Back to the beginning ↑</Link>
      </footer>
    </section>
  );
}
