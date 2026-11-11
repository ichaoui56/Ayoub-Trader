"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveConciergeSettings } from "../server/concierge-actions";
import type { ConciergeSectionSettings } from "../concierge";
import type { Locale } from "../i18n";

type CopyKey =
  | "eyebrow" | "establishment" | "imageAlt" | "imageOverline" | "imageCaption" | "imageIndex"
  | "kicker" | "headingOne" | "headingTwo" | "headingThree" | "headingAccent" | "body"
  | "ctaLabel" | "footerStart" | "footerEnd";

const copyLimits: Record<CopyKey, number> = {
  eyebrow: 120,
  establishment: 120,
  imageAlt: 300,
  imageOverline: 120,
  imageCaption: 160,
  imageIndex: 120,
  kicker: 120,
  headingOne: 100,
  headingTwo: 100,
  headingThree: 100,
  headingAccent: 100,
  body: 1200,
  ctaLabel: 100,
  footerStart: 120,
  footerEnd: 120,
};

const copyFields: { key: CopyKey; label: string; multiline?: boolean }[] = [
  { key: "eyebrow", label: "Section label" },
  { key: "establishment", label: "Topline text" },
  { key: "imageAlt", label: "Image description" },
  { key: "imageOverline", label: "Image overline" },
  { key: "imageCaption", label: "Image caption" },
  { key: "imageIndex", label: "Image index text" },
  { key: "kicker", label: "Heading label" },
  { key: "headingOne", label: "Heading line 1" },
  { key: "headingTwo", label: "Heading line 2" },
  { key: "headingThree", label: "Heading line 3" },
  { key: "headingAccent", label: "Highlighted heading" },
  { key: "body", label: "Description", multiline: true },
  { key: "ctaLabel", label: "Button label" },
  { key: "footerStart", label: "Footer opening" },
  { key: "footerEnd", label: "Footer closing" },
];

async function compressImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPEG, PNG, or WebP image.");
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

export default function ConciergeManagement({ initialSettings }: { initialSettings: ConciergeSectionSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(() => structuredClone(initialSettings));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function updateCopy(key: CopyKey, locale: Locale, value: string) {
    setSettings((current) => ({ ...current, [key]: { ...current[key], [locale]: value } }));
  }

  function updateValue(index: number, field: "title" | "description", locale: Locale, value: string) {
    setSettings((current) => ({
      ...current,
      values: current.values.map((item, itemIndex) => itemIndex === index
        ? { ...item, [field]: { ...item[field], [locale]: value } }
        : item),
    }));
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const compressed = await compressImage(file);
      const uploadForm = new FormData();
      uploadForm.append("file", compressed, "concierge-section.webp");
      const response = await fetch("/api/files", { method: "POST", body: uploadForm, credentials: "same-origin" });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
          ? result.error
          : "Image upload failed. Please try again.";
        throw new Error(message);
      }
      if (typeof result !== "string" || !/^https:\/\//i.test(result)) throw new Error("Image storage returned an invalid URL.");
      setSettings((current) => ({ ...current, image: result }));
      setNotice({ type: "success", text: "Section image uploaded." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Image upload failed." });
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uploading) return;
    setBusy(true);
    setNotice(null);
    try {
      await saveConciergeSettings(settings);
      setNotice({ type: "success", text: "Concierge section saved and published." });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save this section." });
    } finally {
      setBusy(false);
    }
  }

  function localizedField(key: CopyKey, label: string, multiline = false) {
    return (
      <div className="concierge-management__localized" key={key}>
        <p>{label}</p>
        {(["en", "fr"] as const).map((locale) => (
          <label key={locale}>{locale === "en" ? "English" : "French"}
            {multiline ? (
              <textarea value={settings[key][locale]} onChange={(event) => updateCopy(key, locale, event.target.value)} maxLength={copyLimits[key]} rows={key === "body" ? 4 : 2} required />
            ) : (
              <input value={settings[key][locale]} onChange={(event) => updateCopy(key, locale, event.target.value)} maxLength={copyLimits[key]} required />
            )}
          </label>
        ))}
      </div>
    );
  }

  return (
    <section className="dashboard-seo concierge-management" aria-labelledby="concierge-management-title">
      <header className="dashboard-seo__heading">
        <div>
          <p className="transfer-eyebrow">Homepage · Bilingual content</p>
          <h2 id="concierge-management-title">Concierge section</h2>
          <p>Edit the complete homepage story in English and French, including its image, values, and call to action.</p>
        </div>
        <div className="dashboard-seo__heading-actions"><span className="dashboard-seo__mark" aria-hidden="true">✦</span></div>
      </header>

      {notice && <p className={`transfer-notice transfer-notice--${notice.type}`} role="status">{notice.text}</p>}

      <form className="dashboard-seo__form" onSubmit={submit}>
        <fieldset className="dashboard-seo-panel">
          <legend><span>01</span> Visibility and section image</legend>
          <div className="dashboard-seo-grid">
            <label className="concierge-management__toggle"><input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))} /><span>Show this section on the homepage</span></label>
            <label>Section anchor<input value={settings.sectionId} onChange={(event) => setSettings((current) => ({ ...current, sectionId: event.target.value }))} maxLength={41} pattern="[a-z][a-z0-9-]*" required /><small>Lowercase letters, numbers, and hyphens; used by page links.</small></label>
            <label>Image index number<input value={settings.imageIndexNumber} onChange={(event) => setSettings((current) => ({ ...current, imageIndexNumber: event.target.value }))} maxLength={3} pattern="[0-9]{1,3}" required /></label>
            <div className="dashboard-seo-image-field">
              <label>Image URL<input type="url" value={settings.image} onChange={(event) => setSettings((current) => ({ ...current, image: event.target.value }))} maxLength={1200} required /></label>
              <div className="dashboard-seo-image-field__tools">
                <div className="dashboard-seo-image-field__preview">{settings.image && <img src={settings.image} alt="Current Concierge section" />}</div>
                <label className="dashboard-seo-upload">{uploading ? "Uploading…" : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadImage(event)} disabled={uploading || busy} /></label>
              </div>
              <small>JPEG, PNG, or WebP, up to 15 MB. Uploaded images are optimized before storage.</small>
            </div>
          </div>
        </fieldset>

        <fieldset className="dashboard-seo-panel">
          <legend><span>02</span> Section copy</legend>
          <div className="concierge-management__copy-grid">
            {copyFields.map((field) => localizedField(field.key, field.label, field.multiline))}
          </div>
        </fieldset>

        <fieldset className="dashboard-seo-panel">
          <legend><span>03</span> Image seal</legend>
          <div className="concierge-management__copy-grid">
            {settings.seal.map((item, index) => (
              <div className="concierge-management__localized" key={index}>
                <p>Seal label {index + 1}</p>
                {(["en", "fr"] as const).map((locale) => (
                  <label key={locale}>{locale === "en" ? "English" : "French"}
                    <input value={item[locale]} maxLength={30} required onChange={(event) => setSettings((current) => ({
                      ...current,
                      seal: current.seal.map((entry, entryIndex) => entryIndex === index ? { ...entry, [locale]: event.target.value } : entry),
                    }))} />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="dashboard-seo-panel">
          <legend><span>04</span> Journey values</legend>
          <div className="concierge-management__values">
            {settings.values.map((item, index) => (
              <div className="concierge-management__value" key={index}>
                <div className="concierge-management__value-heading"><strong>Value {String(index + 1).padStart(2, "0")}</strong>
                  <button type="button" className="dashboard-seo-remove" onClick={() => setSettings((current) => ({ ...current, values: current.values.filter((_, itemIndex) => itemIndex !== index) }))} disabled={settings.values.length <= 1 || busy}>Remove</button>
                </div>
                {(["title", "description"] as const).map((field) => (
                  <div className="concierge-management__localized" key={field}>
                    <p>{field === "title" ? "Title" : "Description"}</p>
                    {(["en", "fr"] as const).map((locale) => (
                      <label key={locale}>{locale === "en" ? "English" : "French"}
                        {field === "description" ? (
                          <textarea value={item[field][locale]} maxLength={240} rows={2} required onChange={(event) => updateValue(index, field, locale, event.target.value)} />
                        ) : (
                          <input value={item[field][locale]} maxLength={120} required onChange={(event) => updateValue(index, field, locale, event.target.value)} />
                        )}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button type="button" className="transfer-add-button concierge-management__add-value" onClick={() => setSettings((current) => ({ ...current, values: [...current.values, { title: { en: "", fr: "" }, description: { en: "", fr: "" } }] }))} disabled={settings.values.length >= 6 || busy}>＋ Add value</button>
        </fieldset>

        <fieldset className="dashboard-seo-panel">
          <legend><span>05</span> Button and footer</legend>
          <div className="dashboard-seo-grid">
            <label>Button destination<input value={settings.ctaHref} onChange={(event) => setSettings((current) => ({ ...current, ctaHref: event.target.value }))} maxLength={240} placeholder="#contact" required /><small>Use a page anchor such as #contact or a path such as /activities.</small></label>
            <div className="concierge-management__localized concierge-management__localized--plain">
              <p>Button label</p>
              {(["en", "fr"] as const).map((locale) => <label key={locale}>{locale === "en" ? "English" : "French"}<input value={settings.ctaLabel[locale]} maxLength={100} required onChange={(event) => setSettings((current) => ({ ...current, ctaLabel: { ...current.ctaLabel, [locale]: event.target.value } }))} /></label>)}
            </div>
          </div>
        </fieldset>

        <footer className="dashboard-seo__actions">
          <p>Changes publish to the homepage as soon as they are saved.</p>
          <button type="submit" disabled={busy || uploading}><span aria-hidden="true">✦</span>{busy ? "Saving…" : "Save Concierge section"}</button>
        </footer>
      </form>
    </section>
  );
}