"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getActivityImageUrl } from "../activities";
import { updateActivityReservationStatus } from "../server/activity-reservation-actions";
import type { ManagedActivityReservation } from "../server/activity-reservations";

type ReservationStatus = ManagedActivityReservation["status"];

const statusLabels: Record<ReservationStatus, string> = {
  NEW: "Needs review",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`));
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ActivityReservationDetails({ item }: { item: ManagedActivityReservation }) {
  const router = useRouter();
  const [statusDraft, setStatusDraft] = useState<ReservationStatus>(item.status);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function saveStatus() {
    if (busy || statusDraft === item.status) return;
    setBusy(true);
    setNotice("");
    try {
      await updateActivityReservationStatus(item.id, statusDraft);
      setNotice("Reservation status updated.");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update this reservation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="activity-reservation-details-page">
      <Link className="activity-reservation-details-page__back" href="/dashboard/activity-reservations">
        <span aria-hidden="true">←</span> All activity reservations
      </Link>

      <header className="activity-reservation-details-page__header">
        <div>
          <p className="transfer-eyebrow">Reservation · #{item.id.slice(-8).toUpperCase()}</p>
          <h2>{item.customerName}</h2>
          <p>Submitted {formatCreatedAt(item.createdAt)}</p>
        </div>
        <span className={`activity-reservation-pill activity-reservation-pill--${item.status.toLowerCase()}`}>
          {statusLabels[item.status]}
        </span>
      </header>

      <div className="activity-reservation-details-page__grid">
        <main className="activity-reservation-details-page__main">
          <section className="activity-reservation-details-page__section" aria-labelledby="activity-reservation-experiences-title">
            <header><p className="transfer-eyebrow">Itinerary</p><h3 id="activity-reservation-experiences-title">Reserved experiences</h3></header>
            {item.lines.map((line) => (
              <article className="activity-reservation-details-line" key={line.id}>
                <div className="activity-reservation-details-line__image">
                  {line.activityImage ? (
                    <img src={getActivityImageUrl(line.activityImage, 900)} alt={line.activityTitle} />
                  ) : <span aria-hidden="true">✦</span>}
                </div>
                <div className="activity-reservation-details-line__content">
                  <div className="activity-reservation-details-line__title">
                    <div><h4>{line.activityTitle}</h4><p>{line.activityLocation}</p></div>
                    <strong>{formatCurrency(line.lineTotal, item.currency)}</strong>
                  </div>
                  <dl>
                    <div><dt>Date</dt><dd>{formatDate(line.date)}</dd></div>
                    <div><dt>Time</dt><dd>{line.time}</dd></div>
                    <div><dt>Rate</dt><dd>{line.rateLabel} · {formatCurrency(line.ratePrice, item.currency)} {line.rateUnit}</dd></div>
                    <div><dt>Guests</dt><dd>{line.adults} adults{line.children ? ` · ${line.children} children` : ""}</dd></div>
                    {line.extras.length > 0 && <div><dt>Extras</dt><dd>{line.extras.map((extra) => extra.label).join(", ")}</dd></div>}
                  </dl>
                </div>
              </article>
            ))}
          </section>

          <section className="activity-reservation-details-page__section" aria-labelledby="activity-reservation-guest-title">
            <header><p className="transfer-eyebrow">Contact and pickup</p><h3 id="activity-reservation-guest-title">Guest details</h3></header>
            <div className="guest-profile-card">
              <div className="guest-profile-card__identity">
                <span className="guest-profile-card__avatar" aria-hidden="true">{item.customerName.trim().slice(0, 1).toUpperCase()}</span>
                <div><small>Primary contact</small><strong>{item.customerName}</strong></div>
              </div>
              <div className="guest-profile-card__actions">
                <a href={`tel:${item.customerPhone}`}>
                  <span className="guest-profile-card__icon" aria-hidden="true">☎</span>
                  <span><small>Phone / WhatsApp</small><strong>{item.customerPhone}</strong></span>
                  <b aria-hidden="true">↗</b>
                </a>
                {item.customerEmail ? (
                  <a href={`mailto:${item.customerEmail}`}>
                    <span className="guest-profile-card__icon" aria-hidden="true">@</span>
                    <span><small>Email</small><strong>{item.customerEmail}</strong></span>
                    <b aria-hidden="true">↗</b>
                  </a>
                ) : (
                  <div className="is-empty">
                    <span className="guest-profile-card__icon" aria-hidden="true">@</span>
                    <span><small>Email</small><strong>Not provided</strong></span>
                  </div>
                )}
              </div>
              <div className="guest-profile-card__details">
                <div><span aria-hidden="true">⌖</span><div><small>Hotel / pickup</small><strong>{item.hotelAddress || "Not provided"}</strong></div></div>
                <div><span aria-hidden="true">≡</span><div><small>Guest notes</small><strong>{item.notes || "None"}</strong></div></div>
              </div>
            </div>
          </section>
        </main>

        <aside className="activity-reservation-details-summary" aria-label="Reservation summary and status">
          <p className="transfer-eyebrow">Order summary</p>
          <div className="activity-reservation-details-summary__total">
            <span>{item.priceNeedsConfirmation ? "Estimated total · to confirm" : "Estimated total"}</span>
            <strong>{formatCurrency(item.estimatedTotal, item.currency)}</strong>
          </div>
          <label htmlFor="activity-reservation-detail-status">Reservation status</label>
          <select
            id="activity-reservation-detail-status"
            value={statusDraft}
            onChange={(event) => setStatusDraft(event.target.value as ReservationStatus)}
            disabled={busy}
          >
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {notice && <p className="activity-reservation-details-summary__notice" role="status">{notice}</p>}
          <button type="button" disabled={busy || statusDraft === item.status} onClick={saveStatus}>
            {busy ? "Saving…" : statusDraft === "CONFIRMED" ? "Confirm reservation" : "Save status"}
          </button>
          <a href={`https://wa.me/${item.customerPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="activity-reservation-details-summary__whatsapp">
            Message guest on WhatsApp <span aria-hidden="true">↗</span>
          </a>
        </aside>
      </div>
    </section>
  );
}
