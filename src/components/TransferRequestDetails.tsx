"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateTransferRequestStatus } from "../server/transfer-actions";
import type { TransferRequestData } from "../transfers/types";

type RequestStatus = TransferRequestData["status"];

const statusLabels: Record<RequestStatus, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusClasses: Record<RequestStatus, string> = {
  NEW: "transfer-status--new",
  CONFIRMED: "transfer-status--confirmed",
  COMPLETED: "transfer-status--completed",
  CANCELLED: "transfer-status--cancelled",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
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

export default function TransferRequestDetails({ request }: { request: TransferRequestData }) {
  const router = useRouter();
  const [statusDraft, setStatusDraft] = useState<RequestStatus>(request.status);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function saveStatus() {
    if (busy || statusDraft === request.status) return;
    setBusy(true);
    setNotice("");
    try {
      await updateTransferRequestStatus(request.id, statusDraft);
      setNotice("Request status updated.");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update this request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="transfer-request-details-page">
      <Link className="transfer-request-details-page__back" href="/dashboard/requests">
        <span aria-hidden="true">←</span> All transfer requests
      </Link>

      <header className="transfer-request-details-page__header">
        <div>
          <p className="transfer-eyebrow">Guest request · #{request.id.slice(-8).toUpperCase()}</p>
          <h2>{request.customerName}</h2>
          <p>Received {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(request.createdAt))}</p>
        </div>
        <span className={`transfer-status ${statusClasses[request.status]}`}>{statusLabels[request.status]}</span>
      </header>

      <div className="transfer-request-details-page__grid">
        <main className="transfer-request-details-page__main">
          <section className="transfer-drawer-trip" aria-label="Trip summary">
            <div className="transfer-drawer-trip__heading">
              <span>Journey</span>
              <span>{request.serviceType.replaceAll("_", " ")}</span>
            </div>
            <div className="transfer-drawer-trip__route">
              <span className={`transfer-drawer-trip__marker${request.arrival ? "" : " is-single"}`} aria-hidden="true" />
              <div>
                {request.serviceType === "PRIVATE_SERVICE" ? (
                  <div className="transfer-drawer-trip__stop"><small>Service</small><strong>{request.serviceName}</strong></div>
                ) : (
                  <>
                    <div className="transfer-drawer-trip__stop"><small>From</small><strong>{request.departure || "Not provided"}</strong></div>
                    <i aria-hidden="true" />
                    <div className="transfer-drawer-trip__stop"><small>To</small><strong>{request.arrival || "Not provided"}</strong></div>
                  </>
                )}
              </div>
            </div>
            {request.serviceType === "CUSTOM_ROUTE" && <p className="transfer-drawer-trip__service">{request.serviceName}</p>}
            <div className="transfer-drawer-trip__stats">
              <div><span>Date &amp; time</span><strong>{formatDate(request.serviceDate)}</strong><small>{request.serviceTime || "Time not set"}</small></div>
              <div><span>Guests</span><strong>{request.passengerCount}</strong><small>{request.passengerCount === 1 ? "guest" : "guests"}</small></div>
              <div><span>Baggage</span><strong>{request.luggageCount}</strong><small>{request.luggageCount === 1 ? "bag" : "bags"}</small></div>
              <div><span>Price at request</span><strong>{request.priceAtRequest !== null ? formatCurrency(request.priceAtRequest, request.currency) : "Not quoted"}</strong><small>Original quote</small></div>
            </div>
          </section>

          <section className="transfer-drawer-section" aria-labelledby="transfer-request-contact-title">
            <div className="transfer-drawer-section__heading"><span className="transfer-drawer-section__icon" aria-hidden="true">01</span><h3 id="transfer-request-contact-title">Guest details</h3></div>
            <div className="guest-profile-card">
              <div className="guest-profile-card__identity">
                <span className="guest-profile-card__avatar" aria-hidden="true">{request.customerName.trim().slice(0, 1).toUpperCase()}</span>
                <div><small>Primary contact</small><strong>{request.customerName}</strong></div>
              </div>
              <div className="guest-profile-card__actions">
                <a href={`tel:${request.customerPhone}`}><span className="guest-profile-card__icon" aria-hidden="true">☎</span><span><small>Phone</small><strong>{request.customerPhone}</strong></span><b aria-hidden="true">↗</b></a>
              {request.customerEmail ? (
                  <a href={`mailto:${request.customerEmail}`}><span className="guest-profile-card__icon" aria-hidden="true">@</span><span><small>Email</small><strong>{request.customerEmail}</strong></span><b aria-hidden="true">↗</b></a>
              ) : (
                  <div className="is-empty"><span className="guest-profile-card__icon" aria-hidden="true">@</span><span><small>Email</small><strong>Not provided</strong></span></div>
              )}
              </div>
            </div>
          </section>

          <section className="transfer-drawer-section" aria-labelledby="transfer-request-logistics-title">
            <div className="transfer-drawer-section__heading"><span className="transfer-drawer-section__icon" aria-hidden="true">02</span><h3 id="transfer-request-logistics-title">Arrival details</h3></div>
            <dl className="transfer-drawer-details">
              <div><dt>Flight number</dt><dd>{request.flightNumber || "Not provided"}</dd></div>
              <div><dt>Hotel / address</dt><dd>{request.hotelAddress || "Not provided"}</dd></div>
            </dl>
          </section>

          <section className="transfer-drawer-section" aria-labelledby="transfer-request-notes-title">
            <div className="transfer-drawer-section__heading"><span className="transfer-drawer-section__icon" aria-hidden="true">03</span><h3 id="transfer-request-notes-title">Guest notes</h3></div>
            <p className="transfer-drawer-note">{request.notes || "No additional notes provided."}</p>
          </section>
        </main>

        <aside className="transfer-request-details-page__actions" aria-label="Request status and contact">
          <p className="transfer-eyebrow">Manage request</p>
          <label htmlFor="transfer-request-detail-status">Booking status</label>
          <select
            id="transfer-request-detail-status"
            value={statusDraft}
            disabled={busy}
            onChange={(event) => setStatusDraft(event.target.value as RequestStatus)}
          >
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {notice && <p role="status">{notice}</p>}
          <button type="button" disabled={busy || statusDraft === request.status} onClick={saveStatus}>
            {busy ? "Saving…" : "Save status"}
          </button>
          <a className="transfer-drawer-contact" href={`https://wa.me/${request.customerPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
            <span>Message guest on WhatsApp</span><span aria-hidden="true">↗</span>
          </a>
        </aside>
      </div>
    </section>
  );
}
