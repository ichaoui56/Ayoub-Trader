"use client";

import { useState } from "react";
import Link from "next/link";
import { getActivityImageUrl } from "../activities";
import type { ManagedActivityReservation } from "../server/activity-reservations";

type ReservationStatus = ManagedActivityReservation["status"];
type ReservationFilter = "ALL" | ReservationStatus;
type ReservationView = "rows" | "cards";

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
  const [filter, setFilter] = useState<ReservationFilter>("ALL");
  const [view, setView] = useState<ReservationView>("rows");
  const filteredItems = items.filter((item) => filter === "ALL" || item.status === filter);
  const needsReview = items.filter((item) => item.status === "NEW").length;
  const confirmed = items.filter((item) => item.status === "CONFIRMED").length;
  const completed = items.filter((item) => item.status === "COMPLETED").length;

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
          <div className="activity-reservations__toolbar-controls">
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
            <div className="transfer-request-view-toggle" role="group" aria-label="Reservation display">
              <button type="button" className={view === "rows" ? "is-active" : ""} aria-pressed={view === "rows"} onClick={() => setView("rows")}>
                <span aria-hidden="true">☷</span> Rows
              </button>
              <button type="button" className={view === "cards" ? "is-active" : ""} aria-pressed={view === "cards"} onClick={() => setView("cards")}>
                <span aria-hidden="true">▦</span> Cards
              </button>
            </div>
          </div>
        </header>

        {filteredItems.length ? (
          view === "rows" ? (
            <div className="activity-reservations__list">
              {filteredItems.map((reservation) => (
                <Link
                  href={`/dashboard/activity-reservations/${reservation.id}`}
                  className={`activity-reservation-row${reservation.status === "NEW" ? " is-new" : ""}`}
                  key={reservation.id}
                  aria-label={`Open reservation for ${reservation.customerName}, ${reservationLabel(reservation)}`}
                >
                  <span className="activity-reservation-row__image" aria-hidden="true">
                    {reservation.lines[0]?.activityImage
                      ? <img src={getActivityImageUrl(reservation.lines[0].activityImage, 160)} alt="" />
                      : <span>✦</span>}
                  </span>
                  <span className="activity-reservation-row__date">{reservation.lines[0]?.time ?? "--:--"}</span>
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
                </Link>
              ))}
            </div>
          ) : (
            <div className="activity-reservation-cards">
              {filteredItems.map((reservation) => {
                const firstLine = reservation.lines[0];
                return (
                  <Link
                    href={`/dashboard/activity-reservations/${reservation.id}`}
                    className={`activity-reservation-card${reservation.status === "NEW" ? " is-new" : ""}`}
                    key={reservation.id}
                    aria-label={`Open reservation for ${reservation.customerName}, ${reservationLabel(reservation)}`}
                  >
                    <div className="activity-reservation-card__image">
                      {firstLine?.activityImage
                        ? <img src={getActivityImageUrl(firstLine.activityImage, 720)} alt="" />
                        : <span aria-hidden="true">✦</span>}
                      <span className={`activity-reservation-pill activity-reservation-pill--${reservation.status.toLowerCase()}`}>
                        {statusLabels[reservation.status]}
                      </span>
                      {firstLine && <span className="activity-reservation-card__time">◷ {firstLine.time}</span>}
                    </div>
                    <div className="activity-reservation-card__body">
                      <div className="activity-reservation-card__guest">
                        <span className="activity-reservation-card__avatar" aria-hidden="true">{reservation.customerName.slice(0, 1).toUpperCase()}</span>
                        <span><strong>{reservation.customerName}</strong><small>{reservation.customerPhone}</small></span>
                        <span className="activity-reservation-card__arrow" aria-hidden="true">↗</span>
                      </div>
                      <div className="activity-reservation-card__activities">
                        {reservation.lines.slice(0, 2).map((line) => (
                          <span key={line.id}><strong>{line.activityTitle}</strong><small>{line.activityLocation}</small></span>
                        ))}
                        {reservation.lines.length > 2 && <small>+{reservation.lines.length - 2} more experiences</small>}
                        {!reservation.lines.length && <span><strong>Activity request</strong><small>No activity details</small></span>}
                      </div>
                      <div className="activity-reservation-card__footer">
                        <span><small>{firstLine ? formatDate(firstLine.date) : "Date not set"}</small><small>{reservation.lines.length} {reservation.lines.length === 1 ? "experience" : "experiences"}</small></span>
                        <strong>{formatCurrency(reservation.estimatedTotal, reservation.currency)}</strong>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          <div className="activity-reservations__empty">
            <span aria-hidden="true">✳</span>
            <h3>{items.length ? "No requests in this view" : "No activity reservations yet"}</h3>
            <p>{items.length ? "Choose another status filter to see more requests." : "Submitted activity requests will appear here."}</p>
          </div>
        )}
      </section>

    </section>
  );
}
