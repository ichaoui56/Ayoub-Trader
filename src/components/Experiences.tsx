import Link from "next/link";
import { getFeaturedActivities, getActivityImageUrl } from "../activities";
import ActivityReserveButton from "./ActivityReserveButton";

export default function Experiences() {
  const popularActivities = getFeaturedActivities();

  return (
    <section id="experiences" className="experiences-section px-5 py-20 text-ink md:px-[4vw] md:py-28">
      <div className="mx-auto max-w-[1500px]">
        <div className="section-heading-grid">
          <div data-reveal>
            <p className="eyebrow">Experiences</p>
            <h2 className="section-title mt-3 max-w-3xl">
              Don’t just visit.<br />Experience <span className="text-signal">Morocco.</span>
            </h2>
          </div>
          <div className="max-w-sm self-end pb-1" data-reveal>
            <p className="text-sm leading-relaxed text-ink/65">
              From adrenaline-filled adventures to cultural journeys, discover the many sides of Morocco with experiences curated just for you.
            </p>
            <Link href="/activities" className="experiences-section__browse mt-5 inline-flex min-h-11 items-center gap-3 px-4 text-xs font-bold uppercase tracking-wide transition">
              Browse all activities <span aria-hidden="true">↗</span>
            </Link>
            <span className="mt-5 block h-0.5 w-9 bg-signal" />
          </div>
        </div>
        <div className="experiences-grid mt-9" data-stagger>
          {popularActivities.map((activity) => (
            <article key={activity.slug} className="experience-product-card group" data-card>
              <Link href={`/activities/${activity.slug}`} className="experience-product-card__image">
                <figure data-frame className="travel-frame">
                  <img
                    data-frame-image
                    src={getActivityImageUrl(activity.image)}
                    alt={activity.imageAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <span className="experience-product-card__badge">Local pick</span>
                </figure>
              </Link>
              <div className="experience-product-card__body">
                <div className="experience-product-card__topline">
                  <span>{activity.category}</span>
                  {activity.duration && <span>◷ {activity.duration}</span>}
                </div>
                <Link href={`/activities/${activity.slug}`} className="experience-product-card__title">
                  <h3>{activity.title}</h3>
                  <span aria-hidden="true">↗</span>
                </Link>
                <p className="experience-product-card__summary">{activity.summary}</p>
                {activity.priceOptions && (
                  <ul className="experience-product-card__prices">
                    {activity.priceOptions.map((option) => (
                      <li key={option.label}>
                        <span>{option.label}</span>
                        <strong>{option.price}</strong>
                        {option.unit && <small>{option.unit}</small>}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="experience-product-card__footer">
                  {activity.pickup && (
                    <span className="experience-product-card__pickup">
                      <span aria-hidden="true">⌖</span>
                      {activity.pickup.toLowerCase().includes("included") ? "Pickup included" : "Pickup on request"}
                    </span>
                  )}
                  {activity.reservation ? (
                    <ActivityReserveButton activity={activity} className="experience-product-card__reserve">
                      Reserve <span aria-hidden="true">↗</span>
                    </ActivityReserveButton>
                  ) : activity.bookingUrl ? (
                    <a
                      className="experience-product-card__reserve"
                      href={activity.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Reserve <span aria-hidden="true">↗</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="/activities" className="button-signal">
            Show all activities <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
