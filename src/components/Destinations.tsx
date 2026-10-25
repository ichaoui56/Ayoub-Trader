const destinations = [
  { name: "Marrakech", note: "The Red City", image: "photo-1539020140153-e479b8c22e70" },
  { name: "Agadir", note: "Sun & Sea", image: "photo-1507525428034-b723cf961d3e" },
  { name: "Casablanca", note: "Modern & Timeless", image: "photo-1489749798305-4fea3ae63d43" },
  { name: "Tangier", note: "Where Africa meets Europe", image: "photo-1512453979798-5ea266f8880c" },
  { name: "Essaouira", note: "Art & Ocean", image: "photo-1504215680853-026ed2a45def" },
];

export default function Destinations() {
  return (
    <section id="destinations" className="travel-section pt-6">
      <div className="section-heading-grid items-end">
        <div data-reveal>
          <p className="eyebrow">Destinations</p>
          <h2 className="section-title mt-3">Explore Morocco’s iconic cities.</h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-ink/60" data-reveal>
          Five unique destinations.<br />Countless unforgettable moments.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" data-stagger>
        {destinations.map((destination) => (
          <a key={destination.name} href="#contact" className="group block" data-card>
            <figure data-frame className="travel-frame aspect-[1.12]">
              <img
                data-frame-image
                src={`https://images.unsplash.com/${destination.image}?auto=format&fit=crop&w=700&q=80`}
                alt={`${destination.name}, Morocco`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
            </figure>
            <div className="mt-2 flex justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold uppercase">{destination.name}</h3>
                <p className="text-[11px] text-ink/60">{destination.note}</p>
              </div>
              <span aria-hidden="true" className="text-lg">→</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
