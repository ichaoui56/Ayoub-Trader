"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveSiteSeoSettings } from "../server/site-seo-actions";
import type { SiteSeoSettings } from "../seo";

type SeoImageKey = "openGraphImage" | "organizationLogo";

function imageSource(value: string) {
  if (!value) return "";
  return /^photo-[a-zA-Z0-9-]+$/.test(value)
    ? `https://images.unsplash.com/${value}?auto=format&fit=crop&w=960&q=85`
    : value;
}

async function compressSeoImage(file: File) {
  if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose an image smaller than 15 MB.");
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scaleToFit = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    for (const scale of [1, 0.85, 0.7, 0.58, 0.48, 0.4]) {
      const width = Math.max(1, Math.round(image.naturalWidth * scaleToFit * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scaleToFit * scale));
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

export default function DashboardSeoManagement({ initialSettings }: { initialSettings: SiteSeoSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(() => structuredClone(initialSettings));
  const [uploadingImage, setUploadingImage] = useState<SeoImageKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function update<K extends keyof SiteSeoSettings>(key: K, value: SiteSeoSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>, key: SeoImageKey) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setUploadingImage(key);
    setNotice(null);
    try {
      const compressed = await compressSeoImage(file);
      const uploadForm = new FormData();
      uploadForm.append("file", compressed, key === "openGraphImage" ? "site-social-preview.webp" : "organization-logo.webp");
      const response = await fetch("/api/files", { method: "POST", body: uploadForm, credentials: "same-origin" });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
          ? result.error
          : "Image upload failed. Please try again.";
        throw new Error(message);
      }
      if (typeof result !== "string" || !/^https:\/\//i.test(result)) throw new Error("Image storage returned an invalid URL.");
      update(key, result);
      setNotice({ type: "success", text: key === "openGraphImage" ? "Default social preview uploaded." : "Organization logo uploaded." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Image upload failed." });
    } finally {
      setUploadingImage(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || uploadingImage) return;
    setSaving(true);
    setNotice(null);
    try {
      await saveSiteSeoSettings(settings);
      setNotice({ type: "success", text: "Website SEO settings saved and published." });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save SEO settings." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-seo" aria-labelledby="dashboard-seo-title">
      <header className="dashboard-seo__heading">
        <div>
          <p className="transfer-eyebrow">Search · Sharing · Identity</p>
          <h2 id="dashboard-seo-title">Website SEO control</h2>
          <p>Manage the site-wide metadata and search settings inherited by public pages. Individual stories can still override their own metadata.</p>
        </div>
        <span className="dashboard-seo__mark" aria-hidden="true">⌕</span>
      </header>

      {notice && <p className={`transfer-notice transfer-notice--${notice.type}`} role="status">{notice.text}</p>}

      <form className="dashboard-seo__form" onSubmit={submit}>
        <fieldset className="dashboard-seo-panel">
          <legend><span>01</span> Site identity and search defaults</legend>
          <div className="dashboard-seo-grid">
            <label>Website / brand name<input value={settings.siteName} onChange={(event) => update("siteName", event.target.value)} maxLength={120} required /></label>
            <label>Website URL<input type="url" value={settings.siteUrl} onChange={(event) => update("siteUrl", event.target.value)} placeholder="https://example.com" required /></label>
            <label className="is-wide">Title template<input value={settings.titleTemplate} onChange={(event) => update("titleTemplate", event.target.value)} maxLength={160} required /><small>Use %s for the page title, for example: %s | Morocco Journeys.</small></label>
            <label>Default page title · English<input value={settings.titleEn} onChange={(event) => update("titleEn", event.target.value)} maxLength={180} required /></label>
            <label>Default page title · French<input value={settings.titleFr} onChange={(event) => update("titleFr", event.target.value)} maxLength={180} required /></label>
            <label>Meta description · English<textarea value={settings.descriptionEn} onChange={(event) => update("descriptionEn", event.target.value)} maxLength={320} rows={3} required /><small>{settings.descriptionEn.length}/320 characters</small></label>
            <label>Meta description · French<textarea value={settings.descriptionFr} onChange={(event) => update("descriptionFr", event.target.value)} maxLength={320} rows={3} required /><small>{settings.descriptionFr.length}/320 characters</small></label>
            <label>Meta keywords · English<input value={settings.keywordsEn} onChange={(event) => update("keywordsEn", event.target.value)} maxLength={1000} placeholder="Morocco travel, Agadir transfers, …" /><small>Comma-separated. Major search engines may ignore this tag.</small></label>
            <label>Meta keywords · French<input value={settings.keywordsFr} onChange={(event) => update("keywordsFr", event.target.value)} maxLength={1000} placeholder="voyage Maroc, transferts Agadir, …" /></label>
          </div>
        </fieldset>

        <fieldset className="dashboard-seo-panel">
          <legend><span>02</span> Search and social previews</legend>
          <div className="dashboard-seo-grid">
            <label>Open Graph title · English<input value={settings.openGraphTitleEn} onChange={(event) => update("openGraphTitleEn", event.target.value)} maxLength={180} /></label>
            <label>Open Graph title · French<input value={settings.openGraphTitleFr} onChange={(event) => update("openGraphTitleFr", event.target.value)} maxLength={180} /></label>
            <label>Open Graph description · English<textarea value={settings.openGraphDescriptionEn} onChange={(event) => update("openGraphDescriptionEn", event.target.value)} maxLength={320} rows={3} /></label>
            <label>Open Graph description · French<textarea value={settings.openGraphDescriptionFr} onChange={(event) => update("openGraphDescriptionFr", event.target.value)} maxLength={320} rows={3} /></label>
            <div className="dashboard-seo-image-field">
              <label>Default social share image URL or Unsplash ID<input value={settings.openGraphImage} onChange={(event) => update("openGraphImage", event.target.value)} maxLength={1200} placeholder="Leave blank to omit the global image" /></label>
              <div className="dashboard-seo-image-field__tools">
                <div className="dashboard-seo-image-field__preview">{settings.openGraphImage && <img src={imageSource(settings.openGraphImage)} alt="" />}</div>
                <label className="dashboard-seo-upload">{uploadingImage === "openGraphImage" ? "Uploading…" : "Upload social image"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadImage(event, "openGraphImage")} disabled={uploadingImage !== null} /></label>
              </div>
              <small>Used for site-wide link previews when a page has no specific social image.</small>
            </div>
            <label>X / Twitter handle<input value={settings.twitterHandle} onChange={(event) => update("twitterHandle", event.target.value)} maxLength={20} placeholder="@yourbrand" /></label>
          </div>
        </fieldset>

        <fieldset className="dashboard-seo-panel">
          <legend><span>03</span> Crawling and verification</legend>
          <div className="dashboard-seo-toggles">
            <label><input type="checkbox" checked={settings.allowIndexing} onChange={(event) => update("allowIndexing", event.target.checked)} /><span><strong>Allow search indexing</strong><small>Ask search engines to include public pages in results.</small></span></label>
            <label><input type="checkbox" checked={settings.allowFollowing} onChange={(event) => update("allowFollowing", event.target.checked)} /><span><strong>Allow link following</strong><small>Ask search engines to follow links from public pages.</small></span></label>
          </div>
          <p className="dashboard-seo-note">These controls publish robots meta directives; they do not block access to pages. The generated robots.txt allows public pages and disallows dashboard and API routes.</p>
          <div className="dashboard-seo-grid dashboard-seo-grid--verification">
            <label>Google Search Console verification token<input value={settings.googleVerification} onChange={(event) => update("googleVerification", event.target.value)} maxLength={500} placeholder="Paste the meta tag content value" /></label>
            <label>Bing Webmaster verification token<input value={settings.bingVerification} onChange={(event) => update("bingVerification", event.target.value)} maxLength={500} placeholder="Paste the msvalidate.01 content value" /></label>
          </div>
        </fieldset>

        <fieldset className="dashboard-seo-panel">
          <legend><span>04</span> Activities and journal page metadata</legend>
          <div className="dashboard-seo-grid">
            <label>Activities page title · English<input value={settings.activitiesTitleEn} onChange={(event) => update("activitiesTitleEn", event.target.value)} maxLength={180} required /></label>
            <label>Activities page title · French<input value={settings.activitiesTitleFr} onChange={(event) => update("activitiesTitleFr", event.target.value)} maxLength={180} required /></label>
            <label>Activities page description · English<textarea value={settings.activitiesDescriptionEn} onChange={(event) => update("activitiesDescriptionEn", event.target.value)} maxLength={320} rows={3} required /></label>
            <label>Activities page description · French<textarea value={settings.activitiesDescriptionFr} onChange={(event) => update("activitiesDescriptionFr", event.target.value)} maxLength={320} rows={3} required /></label>
            <label>Journal page title · English<input value={settings.journalTitleEn} onChange={(event) => update("journalTitleEn", event.target.value)} maxLength={180} required /></label>
            <label>Journal page title · French<input value={settings.journalTitleFr} onChange={(event) => update("journalTitleFr", event.target.value)} maxLength={180} required /></label>
            <label>Journal page description · English<textarea value={settings.journalDescriptionEn} onChange={(event) => update("journalDescriptionEn", event.target.value)} maxLength={320} rows={3} required /></label>
            <label>Journal page description · French<textarea value={settings.journalDescriptionFr} onChange={(event) => update("journalDescriptionFr", event.target.value)} maxLength={320} rows={3} required /></label>
          </div>
        </fieldset>

        <fieldset className="dashboard-seo-panel">
          <legend><span>05</span> Organization structured data</legend>
          <p className="dashboard-seo-panel__intro">This identity is emitted as Organization and WebSite JSON-LD to help crawlers understand the site and its official profiles.</p>
          <div className="dashboard-seo-grid">
            <label>Organization name<input value={settings.organizationName} onChange={(event) => update("organizationName", event.target.value)} maxLength={120} required /></label>
            <label>Organization website<input value={settings.siteUrl} readOnly /></label>
            <div className="dashboard-seo-image-field">
              <label>Organization logo URL or Unsplash ID<input value={settings.organizationLogo} onChange={(event) => update("organizationLogo", event.target.value)} maxLength={1200} placeholder="Optional HTTPS URL or Unsplash ID" /></label>
              <div className="dashboard-seo-image-field__tools">
                <div className="dashboard-seo-image-field__preview dashboard-seo-image-field__preview--logo">{settings.organizationLogo && <img src={imageSource(settings.organizationLogo)} alt="" />}</div>
                <label className="dashboard-seo-upload">{uploadingImage === "organizationLogo" ? "Uploading…" : "Upload organization logo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadImage(event, "organizationLogo")} disabled={uploadingImage !== null} /></label>
              </div>
            </div>
            <label className="is-wide">Official social profile URLs<textarea value={settings.socialProfiles.join("\n")} onChange={(event) => update("socialProfiles", event.target.value.split("\n").map((url) => url.trim()).filter(Boolean))} rows={4} placeholder="One HTTPS profile URL per line" /><small>Used as sameAs links in the Organization structured data.</small></label>
          </div>
        </fieldset>

        <footer className="dashboard-seo__actions">
          <p>Changes update the public site metadata, search directives, social cards, sitemap URLs, and structured data.</p>
          <button type="submit" disabled={saving || uploadingImage !== null}>{saving ? "Publishing…" : "Save SEO settings"}<span aria-hidden="true">→</span></button>
        </footer>
      </form>
    </section>
  );
}