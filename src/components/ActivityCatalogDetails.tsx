import Link from "next/link";
import { getActivityImageUrl, type ManagedActivity } from "../activities";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default function ActivityCatalogDetails({ item }: { item: ManagedActivity }) {
  const { activity } = item;
  const images = activity.gallery?.length
    ? activity.gallery
    : [{ src: activity.image, alt: activity.imageAlt }];
  const rates = activity.reservation?.rates ?? [];
  const times = activity.reservation?.times ?? [];

  return (
    <section className="activity-catalog-details">
      <Link className="activity-reservation-details-page__back" href="/dashboard/activities">
        <span aria-hidden="true">←</span> All activities
      </Link>

      <header className="activity-catalog-details__header">
        <div>
          <div className="activity-catalog-details__eyebrow">
            <span>{activity.category}</span>
            <span>{activity.location}</span>
            <span className={`transfer-live-badge${item.isActive ? "" : " is-hidden"}`}>{item.isActive ? "Published" : "Hidden"}</span>
            {activity.popular && <span className="activity-catalog-details__featured">Featured</span>}
          </div>
          <h2>{activity.title}</h2>
          <p>{activity.summary}</p>
        </div>
        <div className="activity-catalog-details__header-facts">
          {activity.duration && <span><small>Duration</small><strong>{activity.duration}</strong></span>}
          <span><small>Pace</small><strong>{activity.pace}</strong></span>
        </div>
      </header>

      <div className="activity-catalog-details__layout">
        <main className="activity-catalog-details__main">
          <section className="activity-catalog-details__gallery" aria-label="Activity photos">
            {images.map((image, index) => (
              <figure className={index === 0 ? "is-cover" : ""} key={`${image.src}-${index}`}>
                <img src={getActivityImageUrl(image.src, index === 0 ? 1200 : 800)} alt={image.alt || activity.title} />
                {index === 0 && <figcaption>{activity.title} · {activity.location}</figcaption>}
              </figure>
            ))}
          </section>

          <section className="activity-catalog-details__section">
            <header><p className="transfer-eyebrow">The experience</p><h3>Overview</h3></header>
            <p className="activity-catalog-details__overview">{activity.overview}</p>
          </section>

          {activity.highlights.length > 0 && (
            <section className="activity-catalog-details__section">
              <header><p className="transfer-eyebrow">What makes it special</p><h3>Highlights</h3></header>
              <ul className="activity-catalog-details__list activity-catalog-details__list--checks">
                {activity.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
              </ul>
            </section>
          )}

          {activity.itinerary.length > 0 && (
            <section className="activity-catalog-details__section">
              <header><p className="transfer-eyebrow">The day, step by step</p><h3>Itinerary</h3></header>
              <ol className="activity-catalog-details__itinerary">
                {activity.itinerary.map((step, index) => (
                  <li key={`${step.title}-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><h4>{step.title}</h4><p>{step.description}</p></div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(activity.included?.length || activity.goodToKnow.length) ? (
            <section className="activity-catalog-details__section activity-catalog-details__split">
              {activity.included && activity.included.length > 0 && (
                <div className="activity-catalog-details__included">
                  <header><p className="transfer-eyebrow">Included</p><h3>Part of the experience</h3></header>
                  <ul className="activity-catalog-details__list">
                    {activity.included.map((value) => <li key={value}>{value}</li>)}
                  </ul>
                </div>
              )}
              {activity.goodToKnow.length > 0 && (
                <div className="activity-catalog-details__good-to-know">
                  <header><p className="transfer-eyebrow">Before you go</p><h3>Good to know</h3></header>
                  <ul className="activity-catalog-details__list">
                    {activity.goodToKnow.map((value) => <li key={value}>{value}</li>)}
                  </ul>
                </div>
              )}
            </section>
          ) : null}

          {activity.faqs && activity.faqs.length > 0 && (
            <section className="activity-catalog-details__section">
              <header><p className="transfer-eyebrow">Useful details</p><h3>Questions and answers</h3></header>
              <div className="activity-catalog-details__faqs">
                {activity.faqs.map((faq) => <article key={faq.question}><h4>{faq.question}</h4><p>{faq.answer}</p></article>)}
              </div>
            </section>
          )}
        </main>

        <aside className="activity-catalog-details__booking" aria-label="Activity booking details">
          <p className="transfer-eyebrow">Booking setup</p>
          <h3>Guest options</h3>
          {rates.length > 0 ? (
            <div className="activity-catalog-details__rates">
              {rates.map((rate) => (
                <article key={rate.id}>
                  <div><strong>{rate.label}</strong><small>{rate.unit}{rate.description ? ` · ${rate.description}` : ""}</small></div>
                  <b>{new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(rate.price)}</b>
                </article>
              ))}
              {activity.reservation?.childRate && (
                <article><div><strong>{activity.reservation.childRate.label}</strong><small>Per child</small></div><b>{new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(activity.reservation.childRate.price)}</b></article>
              )}
              {activity.reservation?.priceNeedsConfirmation && <p className="activity-catalog-details__price-note">Final price requires confirmation.</p>}
            </div>
          ) : <p className="activity-catalog-details__empty">No online rates configured.</p>}

          {times.length > 0 && (
            <section className="activity-catalog-details__times">
              <h4>General available times</h4>
              <div>{times.map((time) => <span key={time}>{time.replace("h", ":")}</span>)}</div>
            </section>
          )}

          {activity.reservation?.availability && activity.reservation.availability.length > 0 && (
            <section className="activity-catalog-details__schedule">
              <h4>Date-specific schedule</h4>
              {activity.reservation.availability.map((schedule) => (
                <div key={schedule.date}><strong>{formatDate(schedule.date)}</strong><span>{schedule.times.join(" · ")}</span></div>
              ))}
            </section>
          )}

          {activity.pickup && <section className="activity-catalog-details__pickup"><h4>Pickup</h4><p>{activity.pickup}</p></section>}
          {activity.paymentNote && <section className="activity-catalog-details__pickup"><h4>Payment</h4><p>{activity.paymentNote}</p></section>}
        </aside>
      </div>
    </section>
  );
}
