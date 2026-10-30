import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../../src/components/Nav";
import BlogShareActions from "../../../src/components/BlogShareActions";
import { blogPosts, formatBlogDate, getBlogBySlug, getBlogImageUrl } from "../../../src/blogs";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) {
    return { title: "Story not found" };
  }

  return {
    title: `${post.title} | The Morocco Travel Journal`,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | The Morocco Travel Journal`,
      description: post.excerpt,
      images: [getBlogImageUrl(post.image, 1200)],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts
    .filter((item) => item.slug !== post.slug)
    .slice(0, 2);

  return (
    <>
      <Nav />
      <main className="blog-detail-page min-h-screen px-5 pb-20 pt-28 text-ink md:px-[4vw] md:pt-36">
        <div className="mx-auto max-w-[1500px]">
          <nav aria-label="Breadcrumb" className="blog-breadcrumb">
            <Link href="/blog">The journal</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{post.title}</span>
          </nav>

          <header className="blog-detail__header">
            <div className="blog-detail__heading">
              <p className="eyebrow">{post.category} · {post.location}</p>
              <h1>{post.title}</h1>
              <p className="blog-detail__excerpt">{post.excerpt}</p>
              <div className="blog-detail__byline">
                <span className="blog-detail__byline-mark" aria-hidden="true">M</span>
                <span>Morocco Journeys</span>
                <span aria-hidden="true">·</span>
                <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
                <span aria-hidden="true">·</span>
                <span>{post.readingTime}</span>
              </div>
            </div>
            <figure className="blog-detail__image">
              <img src={getBlogImageUrl(post.image, 2000)} alt={post.imageAlt} fetchPriority="high" />
              <figcaption>{post.location}, Morocco</figcaption>
            </figure>
          </header>

          <BlogShareActions title={post.title} />

          <div className="blog-detail__layout">
            <article className="blog-article">
              <p className="blog-article__introduction">{post.introduction}</p>
              {post.sections.map((section, index) => (
                <section key={section.heading}>
                  <h2><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </section>
              ))}
              <footer className="blog-article__footer">
                <p>Enjoyed this story?</p>
                <Link href="/blog">Find another reason to explore <span aria-hidden="true">↗</span></Link>
              </footer>
            </article>
          </div>

          <section className="blog-related" aria-labelledby="blog-related-title">
            <div className="blog-archive__heading">
              <div>
                <p className="eyebrow">Keep exploring</p>
                <h2 id="blog-related-title">A few more stories</h2>
              </div>
              <Link href="/blog" className="journal-text-link">All stories <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="journal-grid journal-grid--related">
              {relatedPosts.map((relatedPost, index) => (
                <article key={relatedPost.slug} className="journal-card">
                  <Link href={`/blog/${relatedPost.slug}`} className="journal-card__image">
                    <img src={getBlogImageUrl(relatedPost.image)} alt={relatedPost.imageAlt} loading="lazy" />
                    <span className="journal-card__category">{relatedPost.category}</span>
                    <span className="journal-card__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  </Link>
                  <div className="journal-card__body">
                    <div className="journal-card__meta">
                      <span>{formatBlogDate(relatedPost.publishedAt)}</span>
                      <span>{relatedPost.readingTime}</span>
                    </div>
                    <Link href={`/blog/${relatedPost.slug}`} className="journal-card__title">
                      <h3>{relatedPost.title}</h3>
                      <span aria-hidden="true">↗</span>
                    </Link>
                    <p>{relatedPost.excerpt}</p>
                    <Link href={`/blog/${relatedPost.slug}`} className="journal-card__read">
                      Read the story <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
