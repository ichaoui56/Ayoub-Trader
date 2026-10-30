import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../src/components/Nav";
import { blogPosts, formatBlogDate, getBlogImageUrl } from "../../src/blogs";

export const metadata: Metadata = {
  title: "The Morocco Travel Journal",
  description:
    "Local perspectives, thoughtful travel notes, and inspiration for a more considered journey through Morocco.",
};

export default function BlogPage() {
  const [featuredPost, ...otherPosts] = [...blogPosts].sort((first, second) =>
    second.publishedAt.localeCompare(first.publishedAt),
  );

  return (
    <>
      <Nav />
      <main className="blog-page min-h-screen px-5 pb-20 pt-28 text-ink md:px-[4vw] md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <Link href="/#journal" className="blog-back-link">
            <span aria-hidden="true">←</span> Back to the Morocco journey
          </Link>

          <header className="blog-archive-heading">
            <div>
              <p className="eyebrow">The Morocco travel journal</p>
              <h1>Take the<br /><span>scenic route.</span></h1>
            </div>
            <p>Notes from the places, people, and moments that make a journey stay with you.</p>
          </header>

          {featuredPost && (
            <article className="blog-feature">
              <Link href={`/blog/${featuredPost.slug}`} className="blog-feature__image">
                <img src={getBlogImageUrl(featuredPost.image, 1800)} alt={featuredPost.imageAlt} fetchPriority="high" />
                <span className="blog-feature__image-label">The latest story <span aria-hidden="true">↗</span></span>
              </Link>
              <div className="blog-feature__copy">
                <p className="eyebrow">{featuredPost.category} · {featuredPost.location}</p>
                <p className="blog-feature__date">{formatBlogDate(featuredPost.publishedAt)} <span>·</span> {featuredPost.readingTime}</p>
                <Link href={`/blog/${featuredPost.slug}`} className="blog-feature__title">
                  <h2>{featuredPost.title}</h2>
                  <span aria-hidden="true">↗</span>
                </Link>
                <p className="blog-feature__excerpt">{featuredPost.excerpt}</p>
                <Link href={`/blog/${featuredPost.slug}`} className="journal-text-link">
                  Read the story <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          )}

          <section className="blog-archive" aria-labelledby="blog-archive-title">
            <div className="blog-archive__heading">
              <div>
                <p className="eyebrow">A little inspiration</p>
                <h2 id="blog-archive-title">More from the journal</h2>
              </div>
              <span>{String(blogPosts.length).padStart(2, "0")} stories</span>
            </div>
            <div className="journal-grid journal-grid--archive">
              {otherPosts.map((post, index) => (
                <article key={post.slug} className="journal-card">
                  <Link href={`/blog/${post.slug}`} className="journal-card__image">
                    <img src={getBlogImageUrl(post.image)} alt={post.imageAlt} loading="lazy" />
                    <span className="journal-card__category">{post.category}</span>
                    <span className="journal-card__number" aria-hidden="true">{String(index + 2).padStart(2, "0")}</span>
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
          </section>

          <aside className="blog-page__callout">
            <div>
              <p className="eyebrow">Your Morocco, your way</p>
              <h2>Make the journey your own.</h2>
              <p>From the first arrival to the last sunset, we’re here to help you find your rhythm.</p>
            </div>
            <Link href="/#transfer" className="button-signal">Plan your trip <span aria-hidden="true">→</span></Link>
          </aside>
        </div>
      </main>
    </>
  );
}
