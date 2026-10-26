import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../../src/components/Nav";
import { activities, getActivityBySlug, getActivityImageUrl } from "../../../src/activities";
import ActivityGallery from "../../../src/components/ActivityGallery";
import ActivityReserveButton from "../../../src/components/ActivityReserveButton";

type ActivityPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return activities.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ActivityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = getActivityBySlug(slug);

  if (!activity) {
    return { title: "Activity not found" };
  }

  return {
    title: `${activity.title} | Morocco Journeys`,
    description: activity.summary,
    openGraph: {
      title: `${activity.title} | Morocco Journeys`,
      description: activity.summary,
      images: [getActivityImageUrl(activity.image, 1200)],
    },
  };
}

export default async function ActivityDetailPage({ params }: ActivityPageProps) {
  const { slug } = await params;
  const activity = getActivityBySlug(slug);

  if (!activity) {
    notFound();
  }

  const moreActivities = activities
    .filter((item) => item.slug !== activity.slug)
    .sort((first, second) => Number(second.category === activity.category) - Number(first.category === activity.category))
    .slice(0, 3);
  const galleryImages = activity.gallery ?? [
    { src: getActivityImageUrl(activity.image, 1400), alt: activity.imageAlt },
  ];

  return (
    <>
      <Nav />
      <main className="activity-detail-page min-h-screen px-5 pb-20 pt-28 text-ink md:px-[4vw] md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <nav aria-label="Breadcrumb" className="activity-breadcrumb">
            <Link href="/activities">All activities</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{activity.title}</span>
          </nav>

          <header className="activity-detail__hero">
            <div className="activity-detail__copy">
              <p className="eyebrow">{activity.category} · Southern Morocco</p>
              <h1 className="section-title mt-4">{activity.title}</h1>
              <p className="activity-detail__lead">{activity.summary}</p>
              {activity.rating && (
                <a className="activity-detail__rating" href={activity.rating.url} target="_blank" rel="noopener noreferrer">
                  <span aria-hidden="true">★</span> {activity.rating.label}
                </a>
              )}
              <div className="activity-detail__facts">
                <div><span aria-hidden="true">⌖</span><p><small>Where</small>{activity.location}</p></div>
                {activity.duration && <div><span aria-hidden="true">◷</span><p><small>Time to allow</small>{activity.duration}</p></div>}
                <div><span aria-hidden="true">↗</span><p><small>Pace</small>{activity.pace}</p></div>
              </div>
              {activity.bookingUrl ? (
                <aside className="activity-booking-card" aria-label={`Booking information for ${activity.title}`}>
                  <div className="activity-booking-card__heading">
                    <div>
                      <p className="eyebrow">Reserve this experience</p>
                      <h2>{activity.title}</h2>
                    </div>
                    {activity.priceOptions?.length === 1 && (
                      <strong className="activity-booking-card__starting-price">{activity.priceOptions[0].price}</strong>
                    )}
                  </div>
                  {activity.priceOptions && (
                    <ul className="activity-booking-card__prices">
                      {activity.priceOptions.map((option) => (
                        <li key={option.label}>
                          <span>{option.label}</span>
                          <strong>{option.price}</strong>
                          {option.unit && <small>{option.unit}</small>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {activity.pickup && <p className="activity-booking-card__pickup"><span aria-hidden="true">⌖</span> {activity.pickup}</p>}
                  {activity.reservation && (
                    <ActivityReserveButton activity={activity} className="button-signal activity-detail__cta">
                      Build a reservation request <span aria-hidden="true">↗</span>
                    </ActivityReserveButton>
                  )}
                  <a className="activity-detail__partner-link" href={activity.bookingUrl} target="_blank" rel="noopener noreferrer">
                    Book directly with our partner <span aria-hidden="true">↗</span>
                  </a>
                  {activity.paymentNote && <p className="activity-booking-card__note">{activity.paymentNote}</p>}
                </aside>
              ) : (
                <Link href="/#transfer" className="button-signal activity-detail__cta">
                  Plan this experience <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
            <ActivityGallery title={activity.title} location={activity.location} images={galleryImages} />
          </header>

          <div className="activity-detail__content">
            <article className="activity-detail__overview">
              <p className="eyebrow">The experience</p>
              <h2>Get to know {activity.title.toLowerCase()}.</h2>
              <p>{activity.overview}</p>
            </article>

            <aside className="activity-detail__highlights">
              <p className="eyebrow">A few highlights</p>
              <ul>
                {activity.highlights.map((highlight) => (
                  <li key={highlight}><span aria-hidden="true">↗</span>{highlight}</li>
                ))}
              </ul>
            </aside>
          </div>

          {activity.included && (
            <section className="activity-included" aria-labelledby="activity-included-title">
              <div>
                <p className="eyebrow">Part of the experience</p>
                <h2 id="activity-included-title">What’s included</h2>
              </div>
              <ul>
                {activity.included.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          )}

          <section className="activity-itinerary" aria-labelledby="activity-itinerary-title">
            <div className="activity-subheading">
              <p className="eyebrow">A sense of the day</p>
              <h2 id="activity-itinerary-title">What to expect</h2>
            </div>
            <ol>
              {activity.itinerary.map((step, index) => (
                <li key={step.title}>
                  <span className="activity-itinerary__number">{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{step.title}</h3><p>{step.description}</p></div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="activity-good-to-know">
            <div>
              <p className="eyebrow">Before you go</p>
              <h2>Good to know</h2>
            </div>
            <ul>
              {activity.goodToKnow.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </aside>

          {activity.privateOption && (
            <aside className="activity-private-option">
              <div>
                <p className="eyebrow">Prefer a private outing?</p>
                <h2>{activity.privateOption.title}</h2>
                <p>{activity.privateOption.description}</p>
              </div>
              <div className="activity-private-option__action">
                <strong>{activity.privateOption.price}</strong>
                <a href={activity.privateOption.url} target="_blank" rel="noopener noreferrer">
                  Explore private option <span aria-hidden="true">↗</span>
                </a>
              </div>
            </aside>
          )}

          {activity.faqs && (
            <section className="activity-faq" aria-labelledby="activity-faq-title">
              <div className="activity-subheading">
                <p className="eyebrow">Your questions, answered</p>
                <h2 id="activity-faq-title">Questions</h2>
              </div>
              <div className="activity-faq__list">
                {activity.faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <section className="activity-related" aria-labelledby="activity-related-title">
            <div className="activity-subheading">
              <p className="eyebrow">Keep exploring</p>
              <h2 id="activity-related-title">You might also like</h2>
            </div>
            <div className="activities-grid activities-grid--related">
              {moreActivities.map((related) => (
                <article key={related.slug} className="activity-card">
                  <Link href={`/activities/${related.slug}`} className="activity-card__link">
                    <figure className="activity-card__image">
                      <img src={getActivityImageUrl(related.image)} alt={related.imageAlt} loading="lazy" decoding="async" />
                      <span className="activity-card__category">{related.category}</span>
                    </figure>
                    <div className="activity-card__body">
                      <h3>{related.title}</h3>
                      <p>{related.summary}</p>
                      <span className="activity-card__more">Explore activity <span aria-hidden="true">↗</span></span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <div className="activity-detail__back">
            <Link href="/activities"><span aria-hidden="true">←</span> Browse all activities</Link>
          </div>
        </div>
      </main>
    </>
  );
}
