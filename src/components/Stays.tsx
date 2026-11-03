import { translate, type Locale } from "../i18n";

const stays = [
  {
    name: "Roof House Hostel",
    detail: "A sunlit courtyard opens onto a long pool, framed by palms, cacti and loungers for a slower pace between surf sessions.",
    imageAlt: "A swimmer in the courtyard pool, surrounded by palms and cacti",
    location: "BigBlue Alley, Taghazout",
    type: "Surf hostel",
    highlights: ["Courtyard pool", "Sun loungers", "Cactus garden"],
    image: "/DSC00088.jpg",
    href: "https://roofhousetaghazout.com/",
  },
  {
    name: "SurfsHub Hostel",
    detail: "A warm, quiet room pairs natural textures with a hammock by the window, made for slow mornings after a day outside.",
    imageAlt: "A warm-toned guest room with a bed and a hammock beside the window",
    location: "Taghazout",
    type: "Surf hostel",
    highlights: ["Window hammock", "Natural textures", "Soft daylight"],
    image: "/WhatsApp Image 2026-11-02 at 23.55.45.jpeg",
    href: "https://www.booking.com/hotel/ma/surfshub-hostel.html",
  },
  {
    name: "Hashpoint Surf Camp",
    detail: "A welcoming terrace brings people together on cushioned seating, with hillside views as a backdrop for unhurried evenings.",
    imageAlt: "A group gathered on a cushioned terrace overlooking the hillside",
    location: "Taghazout",
    type: "Surf house & school",
    highlights: ["Shared terrace", "Cushioned seating", "Hillside views"],
    image: "/WhatsApp Image 2026-11-02 at 23.55.45 (1).jpeg",
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
                  src={stay.image}
                  alt={t(stay.imageAlt)}
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
                <ul className="stay-card__highlights" aria-label={t("Stay highlights")}>
                  {stay.highlights.map((highlight) => <li key={highlight}>{t(highlight)}</li>)}
                </ul>
                <a className="stay-card__link" href={stay.href} target="_blank" rel="noreferrer">
                  {t("Explore stay")}
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
