import Link from "next/link";

export default function Concierge() {
  return (
    <section id="concierge" className="travel-section">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <figure data-frame className="travel-frame aspect-[1.35]">
          <img
            data-frame-image
            src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1500&q=85"
            alt="A sunlit Moroccan riad terrace with a view over the city"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </figure>
        <div data-reveal>
          <p className="eyebrow">Concierge</p>
          <h2 className="section-title mt-3">
            Your trip. Your pace.<br />Your kind of <span className="text-signal">Morocco.</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink/65">
            Tell us what you’re looking for and we’ll take care of every detail—personalized recommendations, exclusive access and on-the-ground support throughout your journey.
          </p>
          <Link href="#contact" className="button-outline mt-7">Meet your concierge <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}
