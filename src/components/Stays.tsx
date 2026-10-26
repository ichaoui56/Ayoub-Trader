const stays = [
  {
    name: "Traditional riad",
    detail: "Authentic charm in the heart of the medina",
    location: "Marrakech",
    image: "photo-1539020140153-e479b8c22e70",
  },
  {
    name: "Boutique hotel",
    detail: "Thoughtful stays with a sense of place",
    location: "Marrakech",
    image: "photo-1489749798305-4fea3ae63d43",
  },
  {
    name: "Beachside stay",
    detail: "Slow mornings by the Atlantic",
    location: "Essaouira",
    image: "photo-1507525428034-b723cf961d3e",
  },
];

export default function Stays() {
  return (
    <section id="stays" className="stays-section text-paper">
      <div className="stays-section__inner">
        <div className="section-heading-grid">
          <div data-reveal>
            <p className="eyebrow">Places to stay</p>
            <h2 className="section-title mt-3 max-w-3xl">The right place.<br />The right feeling.</h2>
          </div>
          <div className="max-w-sm self-end pb-1" data-reveal>
            <p className="text-sm leading-relaxed text-paper/65">
              From traditional riads to boutique hotels and beachside retreats, we’ll help find the kind of stay that feels like home—with a touch of Morocco.
            </p>
            <span className="mt-5 block h-0.5 w-9 bg-signal" />
          </div>
        </div>
        <div className="stays-section__grid" data-stagger>
          {stays.map((stay, index) => (
            <a key={stay.name} href="#concierge" className="stay-card group" data-card>
              <figure data-frame className="stay-card__image">
                <img
                  data-frame-image
                  src={`https://images.unsplash.com/${stay.image}?auto=format&fit=crop&w=1000&q=85`}
                  alt={`${stay.name} in ${stay.location}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <span className="stay-card__number">0{index + 1}</span>
                <figcaption className="stay-card__caption">
                  <span>{stay.location}</span>
                  <h3>{stay.name}</h3>
                  <p>{stay.detail}</p>
                </figcaption>
                <span className="stay-card__arrow" aria-hidden="true">↗</span>
              </figure>
            </a>
          ))}
        </div>
        <p className="stays-section__footnote">
          A handpicked place to land makes every part of the journey feel better.
        </p>
      </div>
    </section>
  );
}
