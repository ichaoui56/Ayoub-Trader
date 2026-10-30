"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteManagedBlogPost, saveManagedBlogPost } from "../server/blog-actions";
import { getBlogImageUrl, type BlogPost } from "../blogs";
import type { ManagedBlogPost } from "../server/blog-catalog";

type BlogDraft = { id: string | null; isPublished: boolean; post: BlogPost };

const emptyPost = (): BlogPost => ({
  slug: "",
  title: "",
  category: "Travel notes",
  excerpt: "",
  image: "",
  imageAlt: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  readingTime: "5 min read",
  location: "Morocco",
  introduction: "",
  sections: [{ heading: "", paragraphs: [""] }],
  featuredOnHome: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  noIndex: false,
});

function slugFromTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function imageSource(image: string) {
  return image ? getBlogImageUrl(image, 900) : "";
}

async function compressBlogImage(file: File) {
  if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose an image smaller than 15 MB.");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const initialScale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    for (const scale of [1, 0.85, 0.7, 0.58, 0.48, 0.4]) {
      const width = Math.max(1, Math.round(image.naturalWidth * initialScale * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * initialScale * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare the image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      for (const quality of [0.86, 0.74, 0.62, 0.5, 0.38]) {
        const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (compressed?.type === "image/webp" && compressed.size <= 100_000) return compressed;
      }
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
  throw new Error("This image could not be reduced below 100 KB. Try a simpler or smaller photo.");
}

async function uploadBlogImage(file: File, filename: string) {
  const compressed = await compressBlogImage(file);
  const uploadForm = new FormData();
  uploadForm.append("file", compressed, filename);
  const response = await fetch("/api/files", { method: "POST", body: uploadForm, credentials: "same-origin" });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
      ? result.error
      : "Image upload failed. Please try again.";
    throw new Error(message);
  }
  if (typeof result !== "string" || !/^https:\/\//i.test(result)) throw new Error("Image storage returned an invalid URL.");
  return result;
}

export default function BlogManagement({ items }: { items: ManagedBlogPost[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<BlogDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function startCreate() {
    setNotice(null);
    setDraft({ id: null, isPublished: false, post: emptyPost() });
  }

  function startEdit(item: ManagedBlogPost) {
    setNotice(null);
    setDraft({ id: item.id, isPublished: item.isPublished, post: structuredClone(item.post) });
  }

  function updatePost<K extends keyof BlogPost>(key: K, value: BlogPost[K]) {
    setDraft((current) => current ? { ...current, post: { ...current.post, [key]: value } } : current);
  }

  function updateSection(index: number, updates: Partial<BlogPost["sections"][number]>) {
    const sections = [...(draft?.post.sections ?? [])];
    sections[index] = { ...sections[index], ...updates };
    updatePost("sections", sections);
  }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !draft) return;
    setUploading(true);
    setNotice(null);
    try {
      const image = await uploadBlogImage(file, "journal-cover.webp");
      updatePost("image", image);
      if (!draft.post.imageAlt) updatePost("imageAlt", file.name.replace(/\.[^.]+$/, ""));
      setNotice({ type: "success", text: "Cover image uploaded." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Image upload failed." });
    } finally {
      setUploading(false);
    }
  }

  async function uploadSocialImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !draft) return;
    setUploading(true);
    setNotice(null);
    try {
      const image = await uploadBlogImage(file, "journal-social.webp");
      updatePost("ogImage", image);
      setNotice({ type: "success", text: "Social preview image uploaded." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Image upload failed." });
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy || uploading) return;
    setBusy(true);
    setNotice(null);
    try {
      await saveManagedBlogPost(draft.id, draft.post, draft.isPublished);
      setDraft(null);
      setNotice({ type: "success", text: draft.id ? "Blog post updated." : "Blog post created." });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save this blog post." });
    } finally {
      setBusy(false);
    }
  }

  async function removePost(item: ManagedBlogPost) {
    if (!window.confirm(`Permanently delete “${item.post.title}”?`)) return;
    setNotice(null);
    try {
      await deleteManagedBlogPost(item.id);
      setNotice({ type: "success", text: `${item.post.title} deleted.` });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not delete this blog post." });
    }
  }

  return (
    <section className="blog-management" aria-labelledby="blog-management-title">
      <header className="blog-management__heading">
        <div>
          <p className="transfer-eyebrow">Editorial · The travel journal</p>
          <h2 id="blog-management-title">Stories with a sense of place</h2>
          <p>Write, publish, and tune every detail readers and search engines see.</p>
        </div>
        <button type="button" className="transfer-add-button" onClick={startCreate}><span aria-hidden="true">＋</span> New story</button>
      </header>

      <div className="blog-management__summary" aria-label="Journal summary">
        <span><strong>{items.length.toString().padStart(2, "0")}</strong> total stories</span>
        <span><strong>{items.filter((item) => item.isPublished).length.toString().padStart(2, "0")}</strong> published</span>
        <span><strong>{items.filter((item) => item.post.featuredOnHome && item.isPublished).length.toString().padStart(2, "0")}</strong> on homepage</span>
      </div>

      {notice && <p className={`transfer-notice transfer-notice--${notice.type}`} role="status">{notice.text}</p>}

      {items.length ? (
        <div className="blog-management__grid">
          {items.map((item) => (
            <article key={item.id} className={`blog-management-card${item.isPublished ? "" : " is-draft"}`}>
              <div className="blog-management-card__image">
                {item.post.image && <img src={imageSource(item.post.image)} alt={item.post.imageAlt} loading="lazy" />}
                <span className={`blog-management-card__status${item.isPublished ? " is-live" : ""}`}>{item.isPublished ? "Published" : "Draft"}</span>
                {item.post.featuredOnHome && item.isPublished && <span className="blog-management-card__feature">Homepage</span>}
              </div>
              <div className="blog-management-card__body">
                <div className="blog-management-card__meta"><span>{item.post.category}</span><time dateTime={item.post.publishedAt}>{item.post.publishedAt}</time></div>
                <h3>{item.post.title}</h3>
                <p>{item.post.excerpt}</p>
                <div className="blog-management-card__facts"><span>{item.post.sections.length} sections</span><span>{item.post.readingTime}</span><span>{item.post.noIndex ? "No index" : "Indexable"}</span></div>
                <footer>
                  {item.isPublished && <Link href={`/blog/${item.post.slug}`} target="_blank" rel="noreferrer">View story <span aria-hidden="true">↗</span></Link>}
                  <button type="button" onClick={() => startEdit(item)}>Edit story</button>
                  <button type="button" className="is-danger" onClick={() => void removePost(item)}>Delete</button>
                </footer>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="transfer-empty"><span aria-hidden="true">✎</span><h3>Your journal is ready for its next story</h3><p>Create a complete article, add its cover, and prepare its search and social previews.</p><button type="button" className="transfer-add-button" onClick={startCreate}>＋ Create a story</button></div>
      )}

      {draft && (
        <div className="blog-management-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && !uploading && setDraft(null)}>
          <section className="blog-management-editor" role="dialog" aria-modal="true" aria-labelledby="blog-editor-title">
            <header className="blog-management-editor__header">
              <div><p className="transfer-eyebrow">The travel journal · Editor</p><h2 id="blog-editor-title">{draft.id ? "Shape the story" : "Write a new story"}</h2></div>
              <button type="button" aria-label="Close blog editor" disabled={busy || uploading} onClick={() => setDraft(null)}>×</button>
            </header>
            <form onSubmit={submit} className="blog-management-form">
              <fieldset>
                <legend>Story details</legend>
                <div className="blog-management-form__grid">
                  <label className="is-wide">Title<input value={draft.post.title} onChange={(event) => {
                    const title = event.target.value;
                    updatePost("title", title);
                    if (!draft.id) updatePost("slug", slugFromTitle(title));
                  }} maxLength={180} required /></label>
                  <label>URL slug<input value={draft.post.slug} onChange={(event) => updatePost("slug", slugFromTitle(event.target.value))} maxLength={120} required /></label>
                  <label>Category<input value={draft.post.category} onChange={(event) => updatePost("category", event.target.value)} maxLength={100} required placeholder="City notes, On the road…" /></label>
                  <label>Location<input value={draft.post.location} onChange={(event) => updatePost("location", event.target.value)} maxLength={160} required /></label>
                  <label>Publish date<input type="date" value={draft.post.publishedAt} onChange={(event) => updatePost("publishedAt", event.target.value)} required /></label>
                  <label>Reading time<input value={draft.post.readingTime} onChange={(event) => updatePost("readingTime", event.target.value)} maxLength={30} required placeholder="5 min read" /></label>
                  <label className="is-wide">Card excerpt<textarea value={draft.post.excerpt} onChange={(event) => updatePost("excerpt", event.target.value)} maxLength={500} rows={3} required /></label>
                  <label className="is-wide">Article introduction<textarea value={draft.post.introduction} onChange={(event) => updatePost("introduction", event.target.value)} maxLength={5000} rows={5} required /></label>
                </div>
                <div className="blog-management-form__checks">
                  <label><input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} /> Publish this story</label>
                  <label><input type="checkbox" checked={draft.post.featuredOnHome ?? false} onChange={(event) => updatePost("featuredOnHome", event.target.checked)} /> Feature on the homepage</label>
                </div>
              </fieldset>

              <fieldset>
                <legend>Cover image</legend>
                <div className="blog-management-cover">
                  <div className="blog-management-cover__preview">{draft.post.image ? <img src={imageSource(draft.post.image)} alt="" /> : <span aria-hidden="true">▧</span>}</div>
                  <div className="blog-management-cover__fields">
                    <label>Image URL or Unsplash photo ID<input value={draft.post.image} onChange={(event) => updatePost("image", event.target.value)} maxLength={1200} required placeholder="https://…" /></label>
                    <label>Image description<input value={draft.post.imageAlt} onChange={(event) => updatePost("imageAlt", event.target.value)} maxLength={240} required placeholder="Describe the image for accessibility" /></label>
                    <label className="blog-management-upload">{uploading ? "Preparing and uploading…" : "Upload cover image"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadCover(event)} disabled={uploading} /></label>
                    <small>JPEG, PNG or WebP · compressed to WebP and stored securely.</small>
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Article content <small>Up to 30 sections</small></legend>
                <div className="blog-management-form__sections">
                  {draft.post.sections.map((section, index) => (
                    <article className="blog-management-section" key={`section-${index}`}>
                      <div className="blog-management-section__heading"><strong>Section {String(index + 1).padStart(2, "0")}</strong><button type="button" onClick={() => updatePost("sections", draft.post.sections.filter((_, sectionIndex) => sectionIndex !== index))} disabled={draft.post.sections.length <= 1}>Remove section</button></div>
                      <label>Heading<input value={section.heading} onChange={(event) => updateSection(index, { heading: event.target.value })} maxLength={160} required /></label>
                      <label>Paragraphs<textarea value={section.paragraphs.join("\n\n")} onChange={(event) => updateSection(index, { paragraphs: event.target.value.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean) })} rows={7} required placeholder="Separate paragraphs with a blank line" /></label>
                    </article>
                  ))}
                  <button type="button" className="blog-management-add-section" onClick={() => updatePost("sections", [...draft.post.sections, { heading: "", paragraphs: [""] }])} disabled={draft.post.sections.length >= 30}>＋ Add article section</button>
                </div>
              </fieldset>

              <fieldset className="blog-management-seo">
                <legend>Search and social preview</legend>
                <div className="blog-management-seo__preview">
                  <small>SEARCH PREVIEW</small>
                  <strong>{draft.post.seoTitle || draft.post.title || "Your story title"}</strong>
                  <span>{draft.post.canonicalUrl || `https://moroccojourneys.com/blog/${draft.post.slug || "your-story"}`}</span>
                  <p>{draft.post.seoDescription || draft.post.excerpt || "Your search description will appear here."}</p>
                </div>
                <div className="blog-management-form__grid">
                  <label>SEO title <small>{(draft.post.seoTitle || draft.post.title).length}/180</small><input value={draft.post.seoTitle ?? ""} onChange={(event) => updatePost("seoTitle", event.target.value)} maxLength={180} placeholder="Defaults to the article title" /></label>
                  <label>SEO description <small>{(draft.post.seoDescription ?? "").length}/320</small><textarea value={draft.post.seoDescription ?? ""} onChange={(event) => updatePost("seoDescription", event.target.value)} maxLength={320} rows={3} placeholder="Defaults to the excerpt" /></label>
                  <label className="is-wide">Keywords<input value={draft.post.seoKeywords ?? ""} onChange={(event) => updatePost("seoKeywords", event.target.value)} maxLength={500} placeholder="Morocco travel, Marrakech guide, …" /></label>
                  <label className="is-wide">Canonical URL<input type="url" value={draft.post.canonicalUrl ?? ""} onChange={(event) => updatePost("canonicalUrl", event.target.value)} maxLength={1200} placeholder="https://… (optional)" /></label>
                  <label>Social title<input value={draft.post.ogTitle ?? ""} onChange={(event) => updatePost("ogTitle", event.target.value)} maxLength={180} placeholder="Defaults to SEO title" /></label>
                  <label>Social description<textarea value={draft.post.ogDescription ?? ""} onChange={(event) => updatePost("ogDescription", event.target.value)} maxLength={320} rows={3} placeholder="Defaults to SEO description" /></label>
                  <div className="blog-management-form__social-image">
                    <label>Social image URL or Unsplash ID<input value={draft.post.ogImage ?? ""} onChange={(event) => updatePost("ogImage", event.target.value)} maxLength={1200} placeholder="Defaults to cover image" /></label>
                    <div className="blog-management-social-image__tools">
                      <div className="blog-management-social-image__preview">{(draft.post.ogImage || draft.post.image) && <img src={imageSource(draft.post.ogImage || draft.post.image)} alt="" />}</div>
                      <label className="blog-management-upload">{uploading ? "Uploading…" : "Upload social image"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadSocialImage(event)} disabled={uploading} /></label>
                    </div>
                  </div>
                </div>
                <div className="blog-management-noindex">
                  <label className="blog-management-form__check"><input type="checkbox" checked={draft.post.noIndex ?? false} onChange={(event) => updatePost("noIndex", event.target.checked)} /> Ask search engines not to index this story</label>
                  <p>This asks Google and other search engines not to show this page in search results. The story remains public and accessible by its link; search engines may not honor the request.</p>
                </div>
              </fieldset>

              <div className="blog-management-form__actions">
                <button type="submit" disabled={busy || uploading}>{busy ? "Saving…" : draft.id ? "Save changes" : draft.isPublished ? "Publish story" : "Save draft"}</button>
                <button type="button" onClick={() => setDraft(null)} disabled={busy || uploading}>Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}