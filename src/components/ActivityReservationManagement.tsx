"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateActivityReservationStatus } from "../server/activity-reservation-actions";
import type { ManagedActivityReservation } from "../server/activity-reservations";

type ReservationStatus = ManagedActivityReservation["status"];
type ReservationFilter = "ALL" | ReservationStatus;

const statusLabels: Record<ReservationStatus, string> = {
  NEW: "Needs review",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const filters: { value: ReservationFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NEW", label: "Needs review" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
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

function reservationLabel(reservation: ManagedActivityReservation) {
  const firstTitle = reservation.lines[0]?.activityTitle ?? "Activity request";
  return reservation.lines.length > 1 ? `${firstTitle} + ${reservation.lines.length - 1} more` : firstTitle;
}

export default function ActivityReservationManagement({
  items,
}: {
  items: ManagedActivityReservation[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<ReservationFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<ReservationStatus>("NEW");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const filteredItems = items.filter((item) => filter === "ALL" || item.status === filter);
  const needsReview = items.filter((item) => item.status === "NEW").length;
  const confirmed = items.filter((item) => item.status === "CONFIRMED").length;
  const completed = items.filter((item) => item.status === "COMPLETED").length;

  useEffect(() => {
    if (!selectedId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId]);

  function openDetails(reservation: ManagedActivityReservation) {
    setSelectedId(reservation.id);
    setStatusDraft(reservation.status);
    setNotice("");
  }

  async function saveStatus() {
    if (!selected || busy || statusDraft === selected.status) return;
    setBusy(true);
    setNotice("");
    try {
      await updateActivityReservationStatus(selected.id, statusDraft);
      setNotice("Reservation status updated.");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update this reservation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="activity-reservations">
      <div className="activity-reservations__stats" aria-label="Activity reservation summary">
        <article><span>All submissions</span><strong>{items.length}</strong><small>activity requests</small></article>
        <article className="is-attention"><span>Needs review</span><strong>{needsReview}</strong><small>awaiting confirmation</small></article>
        <article><span>Confirmed</span><strong>{confirmed}</strong><small>time slots held</small></article>
        <article><span>Completed</span><strong>{completed}</strong><small>experiences delivered</small></article>
      </div>

      <section className="activity-reservations__panel" aria-label="Activity reservations">
        <header className="activity-reservations__toolbar">
          <div>
            <p className="transfer-eyebrow">Guest bookings</p>
            <h2>Reservation requests</h2>
          </div>
          <nav className="activity-reservations__filters" aria-label="Filter reservations">
            {filters.map((option) => {
              const count = option.value === "ALL"
                ? items.length
                : items.filter((item) => item.status === option.value).length;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={filter === option.value ? "is-active" : ""}
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}<span>{count}</span>
                </button>
              );
            })}
          </nav>
        </header>

        {filteredItems.length ? (
          <div className="activity-reservations__list">
            {filteredItems.map((reservation) => (
              <button
                className={`activity-reservation-row${reservation.status === "NEW" ? " is-new" : ""}`}
                key={reservation.id}
                type="button"
                onClick={() => openDetails(reservation)}
                aria-label={`Open reservation for ${reservation.customerName}, ${reservationLabel(reservation)}`}
              >
                <span className="activity-reservation-row__date" aria-hidden="true">{reservation.lines[0]?.time ?? "--:--"}</span>
                <span className="activity-reservation-row__guest">
                  <strong>{reservation.customerName}</strong>
                  <small>{reservation.customerPhone}</small>
                </span>
                <span className="activity-reservation-row__activity">
                  <strong>{reservationLabel(reservation)}</strong>
                  <small>{reservation.lines[0] ? `${formatDate(reservation.lines[0].date)} · ${reservation.lines[0].activityLocation}` : "No activity details"}</small>
                </span>
                <span className={`activity-reservation-pill activity-reservation-pill--${reservation.status.toLowerCase()}`}>
                  {statusLabels[reservation.status]}
                </span>
                <strong className="activity-reservation-row__total">{formatCurrency(reservation.estimatedTotal, reservation.currency)}</strong>
                <span className="activity-reservation-row__arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="activity-reservations__empty">
            <span aria-hidden="true">✳</span>
            <h3>{items.length ? "No requests in this view" : "No activity reservations yet"}</h3>
            <p>{items.length ? "Choose another status filter to see more requests." : "Submitted activity requests will appear here."}</p>
          </div>
        )}
      </section>

      {selected && (
        <div
          className="activity-reservation-detail-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null);
          }}
        >
          <aside className="activity-reservation-detail" role="dialog" aria-modal="true" aria-labelledby="activity-reservation-detail-title">
            <header className="activity-reservation-detail__header">
              <div>
                <p className="transfer-eyebrow">Reservation · {selected.id.slice(-8).toUpperCase()}</p>
                <h2 id="activity-reservation-detail-title">{selected.customerName}</h2>
                <div className="activity-reservation-detail__meta">
                  <span className={`activity-reservation-pill activity-reservation-pill--${selected.status.toLowerCase()}`}>
                    {statusLabels[selected.status]}
                  </span>
                  <span>Submitted {formatCreatedAt(selected.createdAt)}</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Close reservation details">×</button>
            </header>

            <section className="activity-reservation-detail__section">
              <div className="activity-reservation-detail__section-heading"><span aria-hidden="true">✦</span><h3>Experiences</h3></div>
              {selected.lines.map((line) => (
                <article className="activity-reservation-detail__line" key={line.id}>
                  <div className="activity-reservation-detail__line-heading">
                    <div><h4>{line.activityTitle}</h4><small>{line.activityLocation}</small></div>
                    <strong>{formatCurrency(line.lineTotal, selected.currency)}</strong>
                  </div>
                  <dl>
                    <div><dt>Date</dt><dd>{formatDate(line.date)}</dd></div>
                    <div><dt>Time</dt><dd>{line.time}</dd></div>
                    <div><dt>Rate</dt><dd>{line.rateLabel} · {formatCurrency(line.ratePrice, selected.currency)} {line.rateUnit}</dd></div>
                    <div><dt>Guests</dt><dd>{line.adults} adults{line.children ? ` · ${line.children} children` : ""}</dd></div>
                    {line.extras.length > 0 && <div><dt>Extras</dt><dd>{line.extras.map((extra) => extra.label).join(", ")}</dd></div>}
                  </dl>
                </article>
              ))}
              <div className="activity-reservation-detail__total">
                <span>{selected.priceNeedsConfirmation ? "Estimated total · to confirm" : "Estimated total"}</span>
                <strong>{formatCurrency(selected.estimatedTotal, selected.currency)}</strong>
              </div>
            </section>

            <section className="activity-reservation-detail__section">
              <div className="activity-reservation-detail__section-heading"><span aria-hidden="true">◎</span><h3>Guest details</h3></div>
              <dl className="activity-reservation-detail__contact">
                <div><dt>Phone / WhatsApp</dt><dd><a href={`tel:${selected.customerPhone}`}>{selected.customerPhone}</a></dd></div>
                {selected.customerEmail && <div><dt>Email</dt><dd><a href={`mailto:${selected.customerEmail}`}>{selected.customerEmail}</a></dd></div>}
                <div><dt>Hotel / pickup</dt><dd>{selected.hotelAddress || "Not provided"}</dd></div>
                <div><dt>Notes</dt><dd>{selected.notes || "None"}</dd></div>
              </dl>
            </section>

            <footer className="activity-reservation-detail__footer">
              <label htmlFor="activity-reservation-status">Reservation status</label>
              <select
                id="activity-reservation-status"
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as ReservationStatus)}
              >
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {notice && <p role="status">{notice}</p>}
              <button type="button" disabled={busy || statusDraft === selected.status} onClick={saveStatus}>
                {busy ? "Saving…" : statusDraft === "CONFIRMED" ? "Confirm reservation" : "Save status"}
              </button>
            </footer>
          </aside>
        </div>
      )}
    </section>
  );
}
