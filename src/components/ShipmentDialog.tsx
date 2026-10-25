"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { TRANSPORT_MODES } from "../content";

type Fields = { name: string; email: string; origin: string; destination: string; mode: string; cargo: string };
type Errors = Partial<Record<keyof Fields, string>>;

const validate = (f: Fields): Errors => {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Enter a valid business email, like name@company.com.";
  if (!f.origin.trim()) e.origin = "Enter where the cargo starts.";
  if (!f.destination.trim()) e.destination = "Enter where it needs to go.";
  return e;
};

const buildBrief = (f: Fields) =>
  [
    "FREIGHT / FORWARD — SHIPMENT BRIEF",
    `Prepared in your browser: ${new Date().toLocaleString()}`,
    "",
    `Name: ${f.name.trim()}`,
    `Business email: ${f.email.trim()}`,
    `Origin: ${f.origin.trim()}`,
    `Destination: ${f.destination.trim()}`,
    `Transport mode: ${f.mode}`,
    "",
    "About the cargo:",
    f.cargo.trim() || "(not provided)",
    "",
    "This file was created locally. Nothing was sent to a server.",
  ].join("\n");

function download(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "freight-forward-shipment-brief.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const field = "mt-2 w-full border border-ink bg-paper px-3 py-3 text-base aria-[invalid=true]:border-signal aria-[invalid=true]:border-2";

export default function ShipmentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [brief, setBrief] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) { d.showModal(); document.body.style.overflow = "hidden"; }
    if (!open && d.open) d.close();
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleClosed = () => { setErrors({}); setBrief(null); document.body.style.overflow = ""; onClose(); };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const f: Fields = {
      name: String(d.get("name") ?? ""), email: String(d.get("email") ?? ""),
      origin: String(d.get("origin") ?? ""), destination: String(d.get("destination") ?? ""),
      mode: String(d.get("mode") ?? TRANSPORT_MODES[0]), cargo: String(d.get("cargo") ?? ""),
    };
    const errs = validate(f);
    setErrors(errs);
    const firstBad = (Object.keys(errs) as (keyof Fields)[])[0];
    if (firstBad) { form.current?.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus(); return; }
    const text = buildBrief(f);
    setBrief(text);
    download(text);
  };

  const err = (k: keyof Fields) => errors[k] && (
    <p id={`${k}-err`} className="mt-1 text-sm font-semibold text-ink">⚠ {errors[k]}</p>
  );
  const a11y = (k: keyof Fields) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-err` : undefined });

  return (
    <dialog
      ref={ref}
      aria-labelledby="brief-h"
      onClose={handleClosed}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
      className="m-auto max-h-[92svh] w-[min(40rem,calc(100vw-1.5rem))] overflow-y-auto bg-paper p-0 text-ink"
    >
      <div className="p-6 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm">Your next move</p>
          <button type="button" onClick={() => ref.current?.close()} className="on-light -mr-2 -mt-2 px-3 py-2 text-sm font-semibold hover:text-signal">
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <h2 id="brief-h" className="mt-4 font-display text-[clamp(1.9rem,5vw,3rem)] font-extrabold leading-none tracking-tight">Start with the details.</h2>
        <p className="mt-4">Put your shipment into a clear, downloadable brief. This concept keeps your information in your browser and does not send a quote request.</p>

        {brief ? (
          <div role="status" className="mt-8 border-2 border-ink p-5">
            <p className="font-semibold">Your brief was created as a TXT file on this device.</p>
            <p className="mt-1 text-sm">Check your downloads folder. Nothing was sent to a server.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => download(brief)} className="on-light bg-ink px-5 py-3 font-semibold text-paper hover:bg-signal hover:text-ink">Download again</button>
              <button type="button" onClick={() => ref.current?.close()} className="on-light border border-ink px-5 py-3 font-semibold hover:bg-cloud">Close</button>
            </div>
          </div>
        ) : (
          <form ref={form} onSubmit={submit} noValidate className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Your name
              <input name="name" autoComplete="name" required className={field} {...a11y("name")} />{err("name")}
            </label>
            <label className="block text-sm font-semibold">Business email
              <input name="email" type="email" autoComplete="email" required className={field} {...a11y("email")} />{err("email")}
            </label>
            <label className="block text-sm font-semibold">Origin
              <input name="origin" required className={field} {...a11y("origin")} />{err("origin")}
            </label>
            <label className="block text-sm font-semibold">Destination
              <input name="destination" required className={field} {...a11y("destination")} />{err("destination")}
            </label>
            <label className="block text-sm font-semibold sm:col-span-2">Transport mode
              <select name="mode" className={field}>{TRANSPORT_MODES.map((m) => <option key={m}>{m}</option>)}</select>
            </label>
            <label className="block text-sm font-semibold sm:col-span-2">A little about the cargo
              <textarea name="cargo" rows={4} className={field} />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="on-light bg-ink px-6 py-4 font-semibold text-paper hover:bg-signal hover:text-ink">Prepare my shipment brief ↗</button>
              <p className="mt-3 text-sm text-ink/70">Demo interaction · No data is submitted to a server.</p>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
