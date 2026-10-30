import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import Nav from "../../src/components/Nav";
import { formatBlogDate, getBlogImageUrl } from "../../src/blogs";
import { getPublicBlogPosts } from "../../src/server/blog-catalog";
import { getLocale } from "../../src/server/locale";
import { localizeTree, translate } from "../../src/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "fr" ? {
    title: "Le carnet de voyage du Maroc",
    description: "Regards locaux, récits de voyage et inspirations pour découvrir le Maroc autrement.",
  } : {
    title: "The Morocco Travel Journal",
    description: "Local perspectives, thoughtful travel notes, and inspiration for a more considered journey through Morocco.",
  };
}

export default async function BlogPage() {
  if (process.env.DATABASE_URL) await connection();
  const posts = await getPublicBlogPosts();
  const locale = await getLocale();
  const t = (phrase: string) => translate(locale, phrase);
  const localizedPosts = localizeTree(posts, locale);
  const [featuredPost, ...otherPosts] = [...localizedPosts].sort((first, second) =>
    second.publishedAt.localeCompare(first.publishedAt),
  );

  return (
    <>
      <Nav />
      <main className="blog-page min-h-screen px-5 pb-20 pt-28 text-ink md:px-[4vw] md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <Link href="/#journal" className="blog-back-link">
            <span aria-hidden="true">←</span> {t("Back to the Morocco journey")}
          </Link>

          <header className="blog-archive-heading">
            <div>
              <p className="eyebrow">{t("The Morocco travel journal")}</p>
              <h1>{t("Take the")}<br /><span>{t("scenic route.")}</span></h1>
            </div>
            <p>{t("Notes from the places, people, and moments that make a journey stay with you.")}</p>
          </header>

          {featuredPost && (
            <article className="blog-feature">
              <Link href={`/blog/${featuredPost.slug}`} className="blog-feature__image">
                <img src={getBlogImageUrl(featuredPost.image, 1800)} alt={featuredPost.imageAlt} fetchPriority="high" />
                <span className="blog-feature__image-label">{t("The latest story")} <span aria-hidden="true">↗</span></span>
              </Link>
              <div className="blog-feature__copy">
                <p className="eyebrow">{featuredPost.category} · {featuredPost.location}</p>
                <p className="blog-feature__date">{formatBlogDate(featuredPost.publishedAt, locale)} <span>·</span> {t(featuredPost.readingTime)}</p>
                <Link href={`/blog/${featuredPost.slug}`} className="blog-feature__title">
                  <h2>{featuredPost.title}</h2>
                  <span aria-hidden="true">↗</span>
                </Link>
                <p className="blog-feature__excerpt">{featuredPost.excerpt}</p>
                <Link href={`/blog/${featuredPost.slug}`} className="journal-text-link">
                  {t("Read the story")} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          )}

          <section className="blog-archive" aria-labelledby="blog-archive-title">
            <div className="blog-archive__heading">
              <div>
                <p className="eyebrow">{t("A little inspiration")}</p>
                <h2 id="blog-archive-title">{t("More from the journal")}</h2>
              </div>
              <span>{String(localizedPosts.length).padStart(2, "0")} {t("stories")}</span>
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
                      <span>{formatBlogDate(post.publishedAt, locale)}</span>
                      <span>{t(post.readingTime)}</span>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="journal-card__title">
                      <h3>{post.title}</h3>
                      <span aria-hidden="true">↗</span>
                    </Link>
                    <p>{post.excerpt}</p>
                    <Link href={`/blog/${post.slug}`} className="journal-card__read">
                      {t("Read the story")} <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="blog-page__callout">
            <div>
              <p className="eyebrow">{t("Your Morocco, your way")}</p>
              <h2>{t("Make the journey your own.")}</h2>
              <p>{t("From the first arrival to the last sunset, we’re here to help you find your rhythm.")}</p>
            </div>
            <Link href="/#transfer" className="button-signal">{t("Plan your trip")} <span aria-hidden="true">→</span></Link>
          </aside>
        </div>
      </main>
    </>
  );
}
