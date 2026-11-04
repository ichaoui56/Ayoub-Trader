"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteManagedActivity, saveManagedActivity } from "../server/activity-actions";
import {
  getActivityImageUrl,
  getActivityTranslation,
  DEFAULT_GENERAL_ACTIVITY_TIMES,
  type Activity,
  type ActivityAvailability,
  type ActivityBookingExtra,
  type ActivityBookingRate,
  type ActivityImage,
  type ManagedActivity,
} from "../activities";
import { localizeTree } from "../i18n";

type ActivityDraft = {
  id: string | null;
  isActive: boolean;
  locale: "en" | "fr";
  activity: Activity;
  englishActivity: Activity;
  frenchActivity: Activity;
};

const emptyActivity = (): Activity => ({
  slug: "",
  title: "",
  category: "Adventure",
  summary: "",
  image: "",
  imageAlt: "",
  gallery: [{ src: "", alt: "" }],
  location: "",
  duration: "",
  pace: "Easy",
  overview: "",
  highlights: [],
  itinerary: [],
  goodToKnow: [],
  popular: false,
  pickup: "",
  included: [],
  paymentNote: "",
  reservation: {
    rates: [],
    times: [...DEFAULT_GENERAL_ACTIVITY_TIMES],
    extras: [],
    extraSelectionMode: "multiple",
    priceNeedsConfirmation: false,
  },
});

const newId = () => `option-${Math.random().toString(36).slice(2, 9)}`;
const splitLines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

function withoutTranslations(activity: Activity): Activity {
  const { translations: _translations, ...content } = activity;
  return content;
}

async function compressActivityImage(file: File) {
  if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose an image smaller than 15 MB.");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const initialScale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
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

function slugFromTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ActivityManagement({ items }: { items: ManagedActivity[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ActivityDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadNotice, setImageUploadNotice] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function startCreate() {
    setNotice(null);
    const activity = emptyActivity();
    setDraft({ id: null, isActive: true, locale: "en", activity, englishActivity: activity, frenchActivity: structuredClone(activity) });
  }

  function startEdit(item: ManagedActivity) {
    setNotice(null);
    const englishActivity = withoutTranslations(localizeTree(item.activity, "en"));
    const frenchActivity = withoutTranslations(localizeTree(item.activity, "fr"));
    for (const activity of [englishActivity, frenchActivity]) {
      const images = activity.gallery?.length ? activity.gallery : [{ src: activity.image, alt: activity.imageAlt }];
      activity.gallery = images.map((image) => ({
        ...image,
        src: image.src.startsWith("photo-") ? `https://images.unsplash.com/${image.src}` : image.src,
      }));
    }
    setDraft({ id: item.id, isActive: item.isActive, locale: "en", activity: englishActivity, englishActivity, frenchActivity });
  }

  function updateActivity<K extends keyof Activity>(key: K, value: Activity[K]) {
    setDraft((current) => {
      if (!current) return current;
      const activity = { ...current.activity, [key]: value };
      if (key === "slug" || key === "popular") {
        return {
          ...current,
          activity,
          englishActivity: { ...current.englishActivity, [key]: value },
          frenchActivity: { ...current.frenchActivity, [key]: value },
        };
      }
      return current.locale === "fr"
        ? { ...current, activity, frenchActivity: activity }
        : { ...current, activity, englishActivity: activity };
    });
  }

  function updateReservation(updates: Partial<NonNullable<Activity["reservation"]>>) {
    setDraft((current) => {
      if (!current) return current;
      const existing = current.activity.reservation ?? { rates: [], extras: [] };
      const activity = { ...current.activity, reservation: { ...existing, ...updates } };
      const peer = current.locale === "fr" ? current.englishActivity : current.frenchActivity;
      const peerReservation = peer.reservation;
      const sharedReservation = activity.reservation ? {
        ...activity.reservation,
        rates: activity.reservation.rates.map((rate, index) => ({
          ...rate,
          label: peerReservation?.rates[index]?.label ?? rate.label,
          unit: peerReservation?.rates[index]?.unit ?? rate.unit,
          description: peerReservation?.rates[index]?.description ?? rate.description,
        })),
        extras: activity.reservation.extras?.map((extra, index) => ({
          ...extra,
          label: peerReservation?.extras?.[index]?.label ?? extra.label,
          unit: peerReservation?.extras?.[index]?.unit ?? extra.unit,
        })),
        childRate: activity.reservation.childRate ? {
          ...activity.reservation.childRate,
          label: peerReservation?.childRate?.label ?? activity.reservation.childRate.label,
        } : undefined,
      } : undefined;
      const peerActivity = { ...peer, reservation: sharedReservation };
      return current.locale === "fr"
        ? { ...current, activity, frenchActivity: activity, englishActivity: peerActivity }
        : { ...current, activity, englishActivity: activity, frenchActivity: peerActivity };
    });
  }

  function updateGallery(index: number, updates: Partial<ActivityImage>) {
    setDraft((current) => {
      if (!current) return current;
      const gallery = [...(current.activity.gallery ?? [])];
      gallery[index] = { ...gallery[index], ...updates };
      const activity = { ...current.activity, gallery };
      const peer = current.locale === "fr" ? current.englishActivity : current.frenchActivity;
      const peerGallery = [...(peer.gallery ?? [])];
      if (updates.src !== undefined && peerGallery[index]) {
        peerGallery[index] = { ...peerGallery[index], src: updates.src };
      }
      const peerActivity = { ...peer, gallery: peerGallery };
      return current.locale === "fr"
        ? { ...current, activity, frenchActivity: activity, englishActivity: peerActivity }
        : { ...current, activity, englishActivity: activity, frenchActivity: peerActivity };
    });
  }

  function addGalleryImage() {
    setDraft((current) => {
      if (!current) return current;
      const addImage = (activity: Activity) => ({
        ...activity,
        gallery: [...(activity.gallery ?? []), { src: "", alt: "" }],
      });
      const activity = addImage(current.activity);
      return {
        ...current,
        activity,
        englishActivity: addImage(current.englishActivity),
        frenchActivity: addImage(current.frenchActivity),
      };
    });
  }

  function removeGalleryImage(index: number) {
    setDraft((current) => {
      if (!current) return current;
      const removeImage = (activity: Activity) => ({
        ...activity,
        gallery: (activity.gallery ?? []).filter((_, imageIndex) => imageIndex !== index),
      });
      return {
        ...current,
        activity: removeImage(current.activity),
        englishActivity: removeImage(current.englishActivity),
        frenchActivity: removeImage(current.frenchActivity),
      };
    });
  }

  function updateRate(index: number, updates: Partial<ActivityBookingRate>) {
    const rates = [...(draft?.activity.reservation?.rates ?? [])];
    rates[index] = { ...rates[index], ...updates };
    updateReservation({ rates });
  }

  function updateExtra(index: number, updates: Partial<ActivityBookingExtra>) {
    const extras = [...(draft?.activity.reservation?.extras ?? [])];
    extras[index] = { ...extras[index], ...updates };
    updateReservation({ extras });
  }

  function updateItinerary(index: number, updates: Partial<Activity["itinerary"][number]>) {
    const itinerary = [...(draft?.activity.itinerary ?? [])];
    itinerary[index] = { ...itinerary[index], ...updates };
    updateActivity("itinerary", itinerary);
  }

  function updateAvailability(index: number, updates: Partial<ActivityAvailability>) {
    const availability = [...(draft?.activity.reservation?.availability ?? [])];
    availability[index] = { ...availability[index], ...updates };
    updateReservation({ availability });
  }

  function updateGeneralTime(index: number, value: string) {
    const times = [...(draft?.activity.reservation?.times ?? [])];
    times[index] = value;
    updateReservation({ times });
  }

  async function uploadGalleryImages(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    const currentCount = draft?.activity.gallery?.length ?? 0;
    if (!files.length || !draft) return;
    if (currentCount + files.length > 20) {
      setImageUploadNotice("A gallery can contain up to 20 images.");
      return;
    }

    setUploadingImages(true);
    setImageUploadNotice("");
    let uploaded = 0;
    try {
      for (const file of files) {
        const compressed = await compressActivityImage(file);
        const uploadForm = new FormData();
        uploadForm.append("file", compressed, "activity.webp");
        const response = await fetch("/api/files", { method: "POST", body: uploadForm, credentials: "same-origin" });
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
            ? result.error
            : "Image upload failed. Please try again.";
          throw new Error(message);
        }
        if (typeof result !== "string" || !/^https:\/\//i.test(result)) throw new Error("Image storage returned an invalid URL.");
        setDraft((current) => current ? {
          ...current,
          activity: {
            ...current.activity,
            gallery: [...(current.activity.gallery ?? []), { src: result, alt: file.name.replace(/\.[^.]+$/, "") }],
          },
          englishActivity: {
            ...current.englishActivity,
            gallery: [...(current.englishActivity.gallery ?? []), { src: result, alt: file.name.replace(/\.[^.]+$/, "") }],
          },
          frenchActivity: {
            ...current.frenchActivity,
            gallery: [...(current.frenchActivity.gallery ?? []), { src: result, alt: file.name.replace(/\.[^.]+$/, "") }],
          },
        } : current);
        uploaded += 1;
      }
      setImageUploadNotice(`${uploaded} ${uploaded === 1 ? "image" : "images"} uploaded.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed. Please try again.";
      setImageUploadNotice(uploaded ? `${uploaded} uploaded. ${message}` : message);
    } finally {
      setUploadingImages(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy || uploadingImages) return;
    setBusy(true);
    setNotice(null);
    try {
      const englishActivity = {
        ...draft.englishActivity,
        image: draft.englishActivity.gallery?.[0]?.src ?? "",
        imageAlt: draft.englishActivity.gallery?.[0]?.alt ?? "",
      };
      const frenchActivity = {
        ...draft.frenchActivity,
        image: draft.frenchActivity.gallery?.[0]?.src ?? "",
        imageAlt: draft.frenchActivity.gallery?.[0]?.alt ?? "",
      };
      await saveManagedActivity(draft.id, {
        ...englishActivity,
        translations: { fr: getActivityTranslation(frenchActivity) },
      }, draft.isActive);
      setDraft(null);
      setNotice({ type: "success", text: draft.id ? "Activity updated." : "Activity added." });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save this activity." });
    } finally {
      setBusy(false);
    }
  }

  async function removeActivity(item: ManagedActivity) {
    if (!window.confirm(`Permanently delete ${item.activity.title}?`)) return;
    setNotice(null);
    try {
      await deleteManagedActivity(item.id);
      setNotice({ type: "success", text: `${item.activity.title} deleted.` });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not delete this activity." });
    }
  }

  return (
    <section className="activity-management" aria-labelledby="activity-management-title">
      <header className="activity-management__heading">
        <div>
          <p className="transfer-eyebrow">Experiences · Public catalog</p>
          <h2 id="activity-management-title">Manage activities</h2>
          <p>Build the stories, images and pricing guests see when they plan an experience.</p>
        </div>
        <button type="button" className="transfer-add-button" onClick={startCreate}><span aria-hidden="true">＋</span> Add activity</button>
      </header>

      {notice && <p className={`transfer-notice transfer-notice--${notice.type}`} role="status">{notice.text}</p>}

      {items.length ? (
        <div className="activity-management__grid">
          {items.map((item) => (
            <article key={item.id} className={`activity-management-card${item.isActive ? "" : " is-inactive"}`}>
              <div className="activity-management-card__image">
                <img src={getActivityImageUrl(item.activity.image, 900)} alt={item.activity.imageAlt} loading="lazy" />
                <span className={`transfer-live-badge${item.isActive ? "" : " is-hidden"}`}>{item.isActive ? "Published" : "Hidden"}</span>
                {item.activity.popular && <b>Featured</b>}
              </div>
              <div className="activity-management-card__body">
                <div className="activity-management-card__meta"><span>{item.activity.category}</span><span>{item.activity.duration || "Duration not set"}</span></div>
                <h3>{item.activity.title}</h3>
                <p>{item.activity.summary}</p>
                <div className="activity-management-card__facts">
                  <span>{item.activity.gallery?.length ?? 1} images</span>
                  <span>{item.activity.reservation?.rates.length ?? 0} price options</span>
                  <span>{item.activity.highlights.length} highlights</span>
                </div>
                <div className="activity-management-card__rates">
                  {item.activity.priceOptions?.slice(0, 3).map((option) => (
                    <span key={option.label}><strong>{option.price}</strong><small>{option.unit ?? option.label}</small></span>
                  ))}
                </div>
                <footer>
                  <Link className="activity-management-card__details" href={`/dashboard/activities/${item.activity.slug}`}>View details <span aria-hidden="true">↗</span></Link>
                  <button type="button" onClick={() => startEdit(item)}>Edit activity <span aria-hidden="true">↗</span></button>
                  <button type="button" className="is-danger" onClick={() => void removeActivity(item)}>Delete</button>
                </footer>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="transfer-empty"><span aria-hidden="true">✦</span><h3>Your activity catalog starts here</h3><p>Add an experience with images, highlights and its own per-person or per-vehicle prices.</p><button type="button" className="transfer-add-button" onClick={startCreate}>＋ Add your first activity</button></div>
      )}

      {draft && (
        <div className="activity-management-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && !uploadingImages && setDraft(null)}>
          <section className="activity-management-editor" role="dialog" aria-modal="true" aria-labelledby="activity-editor-title">
            <header className="activity-management-editor__header">
              <div><p className="transfer-eyebrow">Activity catalog</p><h2 id="activity-editor-title">{draft.id ? "Edit activity" : "Add activity"}</h2></div>
              <button type="button" aria-label="Close activity editor" disabled={busy || uploadingImages} onClick={() => setDraft(null)}>×</button>
            </header>
            <form onSubmit={submit} className="activity-management-form">
              <div className="content-language-switch" role="group" aria-label="Activity content language">
                <button type="button" className={draft.locale === "en" ? "is-active" : ""} aria-pressed={draft.locale === "en"} onClick={() => setDraft({ ...draft, locale: "en", activity: draft.englishActivity })}>English</button>
                <button type="button" className={draft.locale === "fr" ? "is-active" : ""} aria-pressed={draft.locale === "fr"} onClick={() => setDraft({ ...draft, locale: "fr", activity: draft.frenchActivity })}>Français</button>
              </div>
              <fieldset>
                <legend>Activity details</legend>
                <div className="activity-management-form__grid">
                  <label>Activity name<input value={draft.activity.title} onChange={(event) => {
                    const title = event.target.value;
                    updateActivity("title", title);
                    if (!draft.id && draft.locale === "en") updateActivity("slug", slugFromTitle(title));
                  }} maxLength={120} required /></label>
                  <label>URL slug<input value={draft.activity.slug} onChange={(event) => updateActivity("slug", slugFromTitle(event.target.value))} maxLength={100} required /></label>
                  <label>Category<input value={draft.activity.category} onChange={(event) => updateActivity("category", event.target.value)} maxLength={80} required placeholder="Adventure, Ocean, Culture…" /></label>
                  <label>Location<input value={draft.activity.location} onChange={(event) => updateActivity("location", event.target.value)} maxLength={160} required /></label>
                  <label>Duration<input value={draft.activity.duration ?? ""} onChange={(event) => updateActivity("duration", event.target.value)} maxLength={100} placeholder="2 hours, half day…" /></label>
                  <label>Pace<input value={draft.activity.pace} onChange={(event) => updateActivity("pace", event.target.value)} maxLength={80} required placeholder="Easy, active…" /></label>
                </div>
                <label>Short description<textarea value={draft.activity.summary} onChange={(event) => updateActivity("summary", event.target.value)} maxLength={500} rows={2} required /></label>
                <label>Full description<textarea value={draft.activity.overview} onChange={(event) => updateActivity("overview", event.target.value)} maxLength={6000} rows={5} required /></label>
                <div className="activity-management-form__checks">
                  <label><input type="checkbox" checked={draft.activity.popular} onChange={(event) => updateActivity("popular", event.target.checked)} /> Feature on the homepage</label>
                  <label><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Publish activity</label>
                </div>
              </fieldset>

              <fieldset>
                <legend>Gallery <small>Up to 20 photos</small></legend>
                <p className="activity-management-form__hint">Upload multiple photos or add image URLs. The first photo is the cover image.</p>
                <label className="activity-management-upload">
                  {uploadingImages ? "Compressing and uploading…" : "Upload photos"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void uploadGalleryImages(event)} disabled={uploadingImages || (draft.activity.gallery?.length ?? 0) >= 20} />
                </label>
                {imageUploadNotice && <p className="activity-management-form__hint" role="status">{imageUploadNotice}</p>}
                <div className="activity-management-form__rows">
                  {(draft.activity.gallery ?? []).map((image, index) => (
                    <div className="activity-management-image-row" key={`image-${index}`}>
                      <div className="activity-management-image-row__preview">{image.src ? <img src={getActivityImageUrl(image.src, 240)} alt="" /> : <span aria-hidden="true">▧</span>}</div>
                      <label>Image URL<input type="url" value={image.src} onChange={(event) => updateGallery(index, { src: event.target.value })} placeholder="https://…" /></label>
                      <label>Image description<input value={image.alt} onChange={(event) => updateGallery(index, { alt: event.target.value })} maxLength={240} placeholder="Describe the photo" /></label>
                      <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => removeGalleryImage(index)} disabled={(draft.activity.gallery?.length ?? 0) <= 1}>×</button>
                    </div>
                  ))}
                  <button type="button" className="activity-management-add-row" onClick={addGalleryImage} disabled={(draft.activity.gallery?.length ?? 0) >= 20}>＋ Add another image</button>
                </div>
              </fieldset>

              <fieldset>
                <legend>Pricing and booking</legend>
                <p className="activity-management-form__hint">Add separate rates for solo, shared, per-person, or per-vehicle options. Vehicle totals scale by the people-per-vehicle capacity.</p>
                <label className="activity-management-form__inline-check"><input type="checkbox" checked={draft.activity.reservation?.priceNeedsConfirmation ?? false} onChange={(event) => updateReservation({ priceNeedsConfirmation: event.target.checked })} /> Final price requires confirmation</label>
                <div className="activity-management-form__rows">
                  {(draft.activity.reservation?.rates ?? []).map((rate, index) => (
                    <div className="activity-management-rate-row" key={rate.id}>
                      <label>Option name<input value={rate.label} onChange={(event) => updateRate(index, { label: event.target.value })} maxLength={100} placeholder="Shared boat, solo quad…" required /></label>
                      <label>Price (€)<input type="number" min="0" max="100000" step="0.01" value={rate.price} onChange={(event) => updateRate(index, { price: Number(event.target.value) })} required /></label>
                      <label>Charge<select value={rate.billing} onChange={(event) => updateRate(index, { billing: event.target.value as ActivityBookingRate["billing"], unit: event.target.value === "unit" ? "per vehicle" : "per person" })}><option value="person">Per person</option><option value="unit">Per vehicle / unit</option></select></label>
                      <label>Unit label<input value={rate.unit} onChange={(event) => updateRate(index, { unit: event.target.value })} maxLength={60} placeholder="per quad, per boat…" required /></label>
                      <label>People per vehicle<input type="number" min="1" max="50" value={rate.peoplePerUnit ?? ""} onChange={(event) => updateRate(index, { peoplePerUnit: event.target.value ? Number(event.target.value) : undefined })} disabled={rate.billing !== "unit"} placeholder="1" /></label>
                      <label>Capacity / pricing note<input value={rate.description ?? ""} onChange={(event) => updateRate(index, { description: event.target.value })} maxLength={240} placeholder="Up to 2 people per jet ski" /></label>
                      <button type="button" aria-label={`Remove ${rate.label || "pricing option"}`} onClick={() => updateReservation({ rates: (draft.activity.reservation?.rates ?? []).filter((_, rateIndex) => rateIndex !== index) })}>Remove rate</button>
                    </div>
                  ))}
                  <button type="button" className="activity-management-add-row" onClick={() => updateReservation({ rates: [...(draft.activity.reservation?.rates ?? []), { id: newId(), label: "", price: 0, unit: "per person", billing: "person" }] })} disabled={(draft.activity.reservation?.rates.length ?? 0) >= 12}>＋ Add pricing option</button>
                </div>
                <div className="activity-management-form__grid">
                  <label>Pickup details<textarea value={draft.activity.pickup ?? ""} onChange={(event) => updateActivity("pickup", event.target.value)} maxLength={600} rows={3} /></label>
                  <label>Payment note<textarea value={draft.activity.paymentNote ?? ""} onChange={(event) => updateActivity("paymentNote", event.target.value)} maxLength={600} rows={3} /></label>
                </div>
                <div className="activity-management-general-times">
                  <div className="activity-management-form__section-title"><strong>General available times</strong><small>Fallback times when no date-specific schedule is set.</small></div>
                  {(draft.activity.reservation?.times ?? []).map((time, index) => (
                    <div className="activity-management-general-time" key={`general-time-${index}`}>
                      <label>Departure time<input type="time" value={time.replace("h", ":")} onChange={(event) => updateGeneralTime(index, event.target.value)} required /></label>
                      <button type="button" aria-label={`Remove general time ${index + 1}`} onClick={() => updateReservation({ times: (draft.activity.reservation?.times ?? []).filter((_, timeIndex) => timeIndex !== index) })}>Remove time</button>
                    </div>
                  ))}
                  <button type="button" className="activity-management-add-row" onClick={() => updateReservation({ times: [...(draft.activity.reservation?.times ?? []), ""] })} disabled={(draft.activity.reservation?.times?.length ?? 0) >= 24}>＋ Add available time</button>
                </div>
                <div className="activity-management-schedules">
                  <div className="activity-management-form__section-title"><strong>Available dates and times</strong><small>Add a date, then add all departure times available on that date. These dates appear in the guest booking form.</small></div>
                  {(draft.activity.reservation?.availability ?? []).map((schedule, index) => (
                    <div className="activity-management-schedule-row" key={`schedule-${index}`}>
                      <label>Available date<input type="date" value={schedule.date} onChange={(event) => updateAvailability(index, { date: event.target.value })} required /></label>
                      <div className="activity-management-schedule-times">
                        <span>Departure times</span>
                        {schedule.times.map((time, timeIndex) => (
                          <div key={`schedule-${index}-time-${timeIndex}`}>
                            <input type="time" aria-label={`Date ${index + 1}, time ${timeIndex + 1}`} value={time} onChange={(event) => updateAvailability(index, { times: schedule.times.map((item, itemIndex) => itemIndex === timeIndex ? event.target.value : item) })} required />
                            <button type="button" aria-label={`Remove time ${timeIndex + 1} from date ${index + 1}`} onClick={() => updateAvailability(index, { times: schedule.times.filter((_, itemIndex) => itemIndex !== timeIndex) })} disabled={schedule.times.length <= 1}>×</button>
                          </div>
                        ))}
                        <button type="button" className="activity-management-add-row" onClick={() => updateAvailability(index, { times: [...schedule.times, ""] })} disabled={schedule.times.length >= 24}>＋ Add time</button>
                      </div>
                      <button type="button" className="activity-management-schedule-remove" onClick={() => updateReservation({ availability: (draft.activity.reservation?.availability ?? []).filter((_, scheduleIndex) => scheduleIndex !== index) })}>Remove date</button>
                    </div>
                  ))}
                  <button type="button" className="activity-management-add-row" onClick={() => updateReservation({ availability: [...(draft.activity.reservation?.availability ?? []), { date: "", times: [""] }] })} disabled={(draft.activity.reservation?.availability?.length ?? 0) >= 60}>＋ Add available date</button>
                </div>
                <div className="activity-management-form__rows">
                  <div className="activity-management-form__section-title"><strong>Optional extras</strong><small>Extras can be billed per person or per vehicle / unit.</small></div>
                  {(draft.activity.reservation?.extras ?? []).map((extra, index) => (
                    <div className="activity-management-rate-row" key={extra.id}>
                      <label>Extra name<input value={extra.label} onChange={(event) => updateExtra(index, { label: event.target.value })} maxLength={100} required /></label>
                      <label>Price (€)<input type="number" min="0" max="100000" step="0.01" value={extra.price} onChange={(event) => updateExtra(index, { price: Number(event.target.value) })} required /></label>
                      <label>Charge<select value={extra.billing} onChange={(event) => updateExtra(index, { billing: event.target.value as ActivityBookingExtra["billing"], unit: event.target.value === "unit" ? "per vehicle" : "per person" })}><option value="person">Per person</option><option value="unit">Per vehicle / unit</option></select></label>
                      <label>Unit label<input value={extra.unit} onChange={(event) => updateExtra(index, { unit: event.target.value })} maxLength={60} required /></label>
                      <button type="button" aria-label={`Remove ${extra.label || "extra"}`} onClick={() => updateReservation({ extras: (draft.activity.reservation?.extras ?? []).filter((_, extraIndex) => extraIndex !== index) })}>Remove extra</button>
                    </div>
                  ))}
                  <button type="button" className="activity-management-add-row" onClick={() => updateReservation({ extras: [...(draft.activity.reservation?.extras ?? []), { id: newId(), label: "", price: 0, unit: "per person", billing: "person" }] })} disabled={(draft.activity.reservation?.extras?.length ?? 0) >= 20}>＋ Add extra</button>
                  <label className="activity-management-form__inline-check">Extra selection
                    <select value={draft.activity.reservation?.extraSelectionMode ?? "multiple"} onChange={(event) => updateReservation({ extraSelectionMode: event.target.value as "single" | "multiple" })}><option value="multiple">Allow multiple extras</option><option value="single">Choose one extra</option></select>
                  </label>
                </div>
                <label className="activity-management-form__inline-check"><input type="checkbox" checked={!!draft.activity.reservation?.childRate} onChange={(event) => updateReservation({ childRate: event.target.checked ? { label: "Child rate", price: 0 } : undefined })} /> Add a separate child rate</label>
                {draft.activity.reservation?.childRate && (
                  <div className="activity-management-form__grid activity-management-form__grid--two">
                    <label>Child rate label<input value={draft.activity.reservation.childRate.label} onChange={(event) => updateReservation({ childRate: { ...draft.activity.reservation!.childRate!, label: event.target.value } })} maxLength={100} required /></label>
                    <label>Child price (€)<input type="number" min="0" max="100000" step="0.01" value={draft.activity.reservation.childRate.price} onChange={(event) => updateReservation({ childRate: { ...draft.activity.reservation!.childRate!, price: Number(event.target.value) } })} required /></label>
                  </div>
                )}
              </fieldset>

              <fieldset>
                <legend>Highlights and included items</legend>
                <div className="activity-management-form__grid activity-management-form__grid--two">
                  <label>A few highlights <small>One highlight per line</small><textarea value={draft.activity.highlights.join("\n")} onChange={(event) => updateActivity("highlights", splitLines(event.target.value))} rows={5} /></label>
                  <label>Part of the experience <small>One included item per line</small><textarea value={(draft.activity.included ?? []).join("\n")} onChange={(event) => updateActivity("included", splitLines(event.target.value))} rows={5} /></label>
                  <label>Before you go <small>One note per line</small><textarea value={draft.activity.goodToKnow.join("\n")} onChange={(event) => updateActivity("goodToKnow", splitLines(event.target.value))} rows={4} /></label>
                </div>
              </fieldset>

              <fieldset>
                <legend>Itinerary</legend>
                <div className="activity-management-form__rows">
                  {draft.activity.itinerary.map((step, index) => (
                    <div className="activity-management-itinerary-row" key={`step-${index}`}>
                      <label>Step title<input value={step.title} onChange={(event) => updateItinerary(index, { title: event.target.value })} maxLength={120} /></label>
                      <label>Step description<textarea value={step.description} onChange={(event) => updateItinerary(index, { description: event.target.value })} maxLength={1000} rows={2} /></label>
                      <button type="button" aria-label={`Remove itinerary step ${index + 1}`} onClick={() => updateActivity("itinerary", draft.activity.itinerary.filter((_, stepIndex) => stepIndex !== index))}>×</button>
                    </div>
                  ))}
                  <button type="button" className="activity-management-add-row" onClick={() => updateActivity("itinerary", [...draft.activity.itinerary, { title: "", description: "" }])} disabled={draft.activity.itinerary.length >= 20}>＋ Add itinerary step</button>
                </div>
              </fieldset>

              <div className="activity-management-form__actions">
                <button type="submit" disabled={busy || uploadingImages}>{busy ? "Saving…" : draft.id ? "Save activity" : "Create activity"}</button>
                <button type="button" onClick={() => setDraft(null)} disabled={busy || uploadingImages}>Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
