import { translate, type Locale } from "../i18n";

const stays = [
  {
    name: "Roof House Hostel",
    detail: "A sociable surf stay in the heart of Taghazout, with shared lounges and a rooftop atmosphere.",
    location: "BigBlue Alley, Taghazout",
    type: "Surf hostel",
    highlights: ["Free breakfast", "Wi-Fi", "Airport shuttle"],
    image: "photo-1502680390469-be75c86b636f",
    href: "https://roofhousetaghazout.com/",
  },
  {
    name: "SurfsHub Hostel",
    detail: "A relaxed base for surf days, with an open-air terrace to wind down after the beach.",
    location: "Taghazout",
    type: "Surf hostel",
    highlights: ["Sun terrace", "Free Wi-Fi", "Shared spaces"],
    image: "photo-1507525428034-b723cf961d3e",
    href: "https://www.booking.com/hotel/ma/surfshub-hostel.html",
  },
  {
    name: "Hashpoint Surf Camp",
    detail: "A surf house with an on-site surf school, for a stay built around the waves.",
    location: "Taghazout",
    type: "Surf house & school",
    highlights: ["Surf lessons", "Surf house", "Local surf spots"],
    image: "photo-1518837695005-2083093ee35b",
    href: "https://www.hashpointsurfcamp.com/the-house",
  },
];

export default function Stays({ locale }: { locale: Locale }) {
  const t = (phrase: string) => translate(locale, phrase);
  return (
    <section id="stays" className="stays-section text-paper">
      <div className="stays-section__inner">
        <div className="section-heading-grid">
          <div data-reveal>
            <p className="eyebrow">{t("Places to stay")}</p>
            <h2 className="section-title mt-3 max-w-3xl">{t("The right place.")}<br />{t("The right feeling.")}</h2>
          </div>
          <div className="max-w-sm self-end pb-1" data-reveal>
            <p className="text-sm leading-relaxed text-paper/65">
              {t("Three Taghazout stays for surf, sea air and easy mornings in Morocco’s Atlantic coast village.")}
            </p>
            <span className="mt-5 block h-0.5 w-9 bg-signal" />
          </div>
        </div>
        <div className="stays-section__grid" data-stagger>
          {stays.map((stay, index) => (
            <article key={stay.name} className="stay-card" data-card>
              <figure data-frame className="stay-card__image">
                <img
                  data-frame-image
                  src={`https://images.unsplash.com/${stay.image}?auto=format&fit=crop&w=1000&q=85`}
                  alt={`${t(stay.name)} in ${t(stay.location)}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="stay-card__number">0{index + 1}</span>
              </figure>
              <div className="stay-card__content">
                <p className="stay-card__type">{t(stay.type)}</p>
                <h3>{t(stay.name)}</h3>
                <p className="stay-card__location">{t(stay.location)}</p>
                <p className="stay-card__detail">{t(stay.detail)}</p>
                <ul className="stay-card__highlights" aria-label={t("Hostel highlights")}>
                  {stay.highlights.map((highlight) => <li key={highlight}>{t(highlight)}</li>)}
                </ul>
                <a className="stay-card__link" href={stay.href} target="_blank" rel="noreferrer">
                  {t("Visit hostel")}
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
        <p className="stays-section__footnote">
          {t("Check each hostel’s website for current rooms, services and availability.")}
        </p>
      </div>
    </section>
  );
}
