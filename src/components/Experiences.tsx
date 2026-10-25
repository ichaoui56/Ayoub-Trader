const experiences = [
  { title: "Quad biking", detail: "Explore the landscapes", image: "photo-1500530855697-b586d89ba3ee" },
  { title: "Jet skiing", detail: "Feel the freedom", image: "photo-1504215680853-026ed2a45def" },
  { title: "Surfing", detail: "Ride the Atlantic waves", image: "photo-1502680390469-be75c86b636f" },
  { title: "Camel ride", detail: "Timeless Moroccan tradition", image: "photo-1464822759023-fed622ff2c3b" },
  { title: "Boat trip", detail: "Discover hidden gems", image: "photo-1501785888041-af3ef285b470" },
  { title: "Guided city tour", detail: "History, culture, people", image: "photo-1512453979798-5ea266f8880c" },
];

export default function Experiences() {
  return (
    <section id="experiences" className="bg-ink px-5 py-20 text-paper md:px-[4vw] md:py-28">
      <div className="mx-auto max-w-[1500px]">
        <div className="section-heading-grid">
          <div data-reveal>
            <p className="eyebrow">Experiences</p>
            <h2 className="section-title mt-3 max-w-3xl text-paper">
              Don’t just visit.<br />Experience <span className="text-signal">Morocco.</span>
            </h2>
          </div>
          <div className="max-w-sm self-end pb-1" data-reveal>
            <p className="text-sm leading-relaxed text-paper/65">
              From adrenaline-filled adventures to cultural journeys, discover the many sides of Morocco with experiences curated just for you.
            </p>
            <span className="mt-5 block h-0.5 w-9 bg-signal" />
          </div>
        </div>
        <div className="mt-9 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3" data-stagger>
          {experiences.map((experience) => (
            <a key={experience.title} href="#concierge" className="group block" data-card>
              <figure data-frame className="travel-frame aspect-[1.75]">
                <img
                  data-frame-image
                  src={`https://images.unsplash.com/${experience.image}?auto=format&fit=crop&w=1000&q=85`}
                  alt={experience.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </figure>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase">{experience.title}</h3>
                  <p className="text-xs text-paper/60">{experience.detail}</p>
                </div>
                <span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">→</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
