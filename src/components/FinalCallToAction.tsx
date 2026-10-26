import Link from "next/link";
import Logo from "./Logo";

export default function FinalCallToAction() {
  return (
    <section id="contact" className="travel-section pb-8 pt-12">
      <div className="flex flex-col gap-7 border-b border-ink/15 pb-9 md:flex-row md:items-center md:justify-between">
        <h2 className="section-title max-w-2xl">
          Let’s make your arrival<br /><span className="text-signal">unforgettable.</span>
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="#transfer" className="button-signal">Reserve your pickup <span aria-hidden="true">→</span></Link>
          <Link href="#destinations" className="button-outline">Discover Morocco <span aria-hidden="true">→</span></Link>
        </div>
      </div>
      <footer className="flex flex-col gap-5 pt-6 text-xs text-ink/60 md:flex-row md:items-center md:justify-between">
        <Logo className="text-ink" />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="#transfer">Airport transfers</Link>
          <Link href="#stays">Places to stay</Link>
          <Link href="#experiences">Experiences</Link>
          <Link href="#concierge">Notre Histoire</Link>
        </nav>
        <p>More than a trip. A journey.</p>
      </footer>
    </section>
  );
}
