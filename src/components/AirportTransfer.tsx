"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

const inputClass =
  "mt-2 min-h-12 w-full border border-ink/15 bg-paper px-3 text-sm outline-none transition focus:border-signal";

export default function AirportTransfer() {
  const [message, setMessage] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const destination = String(data.get("destination") ?? "").trim();
    const date = String(data.get("arrival-date") ?? "");
    setMessage(
      `Your ${destination || "Morocco"} transfer details for ${date || "your arrival"} are ready. This preview does not send a booking.`,
    );
  };

  return (
    <section id="transfer" className="travel-section scroll-mt-20">
      <div className="transfer-panel" data-reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Book your transfer</p>
            <h2 className="section-title mt-3 max-w-2xl">
              Land. Relax.
              <br />
              We’ll take it from here.
            </h2>
          </div>
          <p className="flex items-center gap-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55">
            <span className="h-px w-8 bg-signal" />
            Fast / Safe / Comfortable
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-x-5 gap-y-5 md:grid-cols-6">
          <label className="text-xs font-semibold md:col-span-3">
            Airport / pickup
            <select name="pickup" className={inputClass} defaultValue="" required>
              <option value="" disabled>Select airport or pickup location</option>
              <option>Marrakech Menara Airport</option>
              <option>Casablanca Mohammed V Airport</option>
              <option>Rabat-Salé Airport</option>
              <option>Tangier Ibn Battouta Airport</option>
            </select>
          </label>
          <label className="text-xs font-semibold md:col-span-3">
            Destination
            <select name="destination" className={inputClass} defaultValue="" required>
              <option value="" disabled>Where are you going?</option>
              <option>Marrakech</option>
              <option>Agadir</option>
              <option>Casablanca</option>
              <option>Tangier</option>
              <option>Essaouira</option>
            </select>
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Arrival date
            <input name="arrival-date" type="date" className={inputClass} required />
          </label>
          <label className="text-xs font-semibold md:col-span-1">
            Time
            <input name="arrival-time" type="time" className={inputClass} required />
          </label>
          <label className="text-xs font-semibold md:col-span-1">
            Passengers
            <select name="passengers" className={inputClass} defaultValue="1">
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "passenger" : "passengers"}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold md:col-span-2">
            Suitcases
            <select name="suitcases" className={inputClass} defaultValue="0">
              {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "suitcase" : "suitcases"}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold md:col-span-3">
            Transfer type
            <select name="transfer-type" className={inputClass}>
              <option>Private transfer</option>
              <option>Premium private transfer</option>
              <option>Group transfer</option>
            </select>
          </label>
          <div className="flex flex-col justify-end gap-3 md:col-span-3 md:items-end">
            <button type="submit" className="button-dark w-full md:w-auto">
              Check my transfer <span aria-hidden="true">↗</span>
            </button>
            {message && <p role="status" className="max-w-md text-right text-xs text-ink/65">{message}</p>}
          </div>
        </form>
        <p className="mt-5 text-xs text-ink/55">
          Planning a different kind of trip? <Link href="#concierge" className="font-semibold underline decoration-signal underline-offset-4">Talk to our concierge</Link>
        </p>
      </div>
    </section>
  );
}
