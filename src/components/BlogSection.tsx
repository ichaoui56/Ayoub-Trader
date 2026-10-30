import Link from "next/link";
import { blogPosts, formatBlogDate, getBlogImageUrl } from "../blogs";

export default function BlogSection() {
  const latestPosts = [...blogPosts]
    .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
    .slice(0, 3);

  return (
    <section id="journal" className="journal-section px-5 py-20 text-ink md:px-[4vw] md:py-28">
      <div className="mx-auto max-w-[1500px]">
        <div className="section-heading-grid items-end">
          <div data-reveal>
            <p className="eyebrow">The travel journal</p>
            <h2 className="section-title mt-3 max-w-3xl">Stories for the road.</h2>
          </div>
          <div className="journal-section__intro" data-reveal>
            <p>Thoughtful notes, local perspectives, and little reasons to take the scenic route.</p>
            <Link href="/blog" className="journal-text-link">
              Explore all stories <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div className="journal-grid" data-stagger>
          {latestPosts.map((post, index) => (
            <article key={post.slug} className={`journal-card${index === 0 ? " journal-card--featured" : ""}`} data-card>
              <Link href={`/blog/${post.slug}`} className="journal-card__image">
                <img
                  src={getBlogImageUrl(post.image, index === 0 ? 1400 : 900)}
                  alt={post.imageAlt}
                  loading="lazy"
                />
                <span className="journal-card__category">{post.category}</span>
                <span className="journal-card__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              </Link>
              <div className="journal-card__body">
                <div className="journal-card__meta">
                  <span>{formatBlogDate(post.publishedAt)}</span>
                  <span>{post.readingTime}</span>
                </div>
                <Link href={`/blog/${post.slug}`} className="journal-card__title">
                  <h3>{post.title}</h3>
                  <span aria-hidden="true">↗</span>
                </Link>
                <p>{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="journal-card__read">
                  Read the story <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="journal-section__mobile-link">
          <Link href="/blog" className="button-outline">
            Browse the journal <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
