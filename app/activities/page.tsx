import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../src/components/Nav";
import ActivityDirectory from "../../src/components/ActivityDirectory";
import { activities, getActivityImageUrl, getFeaturedActivities } from "../../src/activities";

export const metadata: Metadata = {
  title: "Morocco Activities & Experiences",
  description:
    "Explore outdoor adventures, ocean activities, local culture, food, and wellbeing experiences around Agadir and Taghazout.",
};

export default function ActivitiesPage() {
  const featuredActivities = getFeaturedActivities();
  const heroActivity = featuredActivities.find((activity) => activity.slug === "mini-sahara-massa") ?? featuredActivities[0];
  const allActivities = [
    ...featuredActivities,
    ...activities.filter((activity) => !activity.popular),
  ];

  return (
    <>
      <Nav />
      <main className="activities-page min-h-screen px-5 pb-20 pt-28 text-ink md:px-[4vw] md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <Link href="/#experiences" className="activity-back-link">
            <span aria-hidden="true">←</span> Back to the Morocco journey
          </Link>

          <header className="activities-discover-hero">
            <div className="activities-discover-hero__copy">
              <p className="eyebrow">The good stuff starts out there</p>
              <h1>
                Make room<br />for <span>the unexpected.</span>
              </h1>
              <p className="activities-discover-hero__intro">
                Surf the Atlantic, follow the dunes, or take the scenic way inland. Find an experience that feels like your kind of Morocco.
              </p>
              <a href="#activity-list" className="activities-discover-hero__button">
                Find your experience <span aria-hidden="true">↓</span>
              </a>
              <div className="activities-discover-hero__trust">
                <span aria-hidden="true">✳</span>
                <p><strong>Local moments, made easy.</strong><br />Straightforward details. Book directly with our activity partners.</p>
              </div>
            </div>
            <div className="activities-discover-hero__visual">
              <img
                src={getActivityImageUrl(heroActivity.image, 1400)}
                alt={heroActivity.imageAlt}
                fetchPriority="high"
              />
              <div className="activities-discover-hero__image-shade" />
              <div className="activities-discover-hero__image-caption">
                <span>OUT THERE IS CLOSER THAN YOU THINK</span>
                <strong>South of Agadir</strong>
              </div>
              <div className="activities-discover-hero__stamp" aria-hidden="true">
                <span>GO</span><span>YOUR</span><span>OWN</span><span>WAY</span>
              </div>
              <div className="activities-discover-hero__note">
                <span className="activities-discover-hero__note-icon" aria-hidden="true">↗</span>
                <p><strong>12 ways to get out there</strong><br />From quick thrills to full-day escapes</p>
              </div>
            </div>
          </header>

          <div className="activities-page__highlights" aria-label="Activity highlights">
            <div><strong>{String(featuredActivities.length).padStart(2, "0")}</strong><span>local favourites</span></div>
            <span className="activities-page__highlights-divider" aria-hidden="true" />
            <div><strong>{String(allActivities.length).padStart(2, "0")}</strong><span>ways to explore</span></div>
            <span className="activities-page__highlights-divider" aria-hidden="true" />
            <div><strong>Agadir</strong><span>and beyond</span></div>
          </div>
          <ActivityDirectory activities={allActivities} />

          <aside className="activities-page__callout">
            <div>
              <p className="eyebrow">Make it your own</p>
              <h2>Need help choosing?</h2>
              <p>Tell us when you’re travelling and what you enjoy. We’ll help you plan the rest of your journey.</p>
            </div>
            <Link href="/#transfer" className="button-signal">
              Plan your trip <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
