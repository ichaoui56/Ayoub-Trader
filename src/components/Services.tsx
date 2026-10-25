"use client";

import Link from "next/link";
import { useState } from "react";
import { SERVICES } from "../content";

export default function Services() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="services" className="bg-ink px-5 py-24 text-paper md:px-[4vw] md:py-36">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-paper/20 pb-4 text-sm">
        <p>02 / Built around your cargo</p>
        <p className="text-paper/70">From the first mile to the last.</p>
      </div>
      <h2 className="mt-10 max-w-[14ch] font-display text-[clamp(2.4rem,7vw,7rem)] font-extrabold uppercase leading-[0.92] tracking-tight">
        Every route. One direction.
      </h2>
      <p className="mt-6 max-w-md text-lg text-paper/80">
        A connected view of the whole journey. Explore the services that bring your freight from where it is to where it needs to be.
      </p>

      <ul className="mt-14 border-t border-paper/20">
        {SERVICES.map((s, i) => {
          const isOpen = open === i;
          return (
            <li key={s.title} className="border-b border-paper/20">
              <h3>
                <button
                  type="button"
                  id={`svc-btn-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`svc-panel-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-5 py-6 text-left md:gap-10 md:py-8"
                >
                  <span className="w-8 text-sm text-signal md:w-14">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-display text-[clamp(1.5rem,3.6vw,3.2rem)] font-extrabold leading-none tracking-tight">{s.title}</span>
                  <span aria-hidden="true" className="text-3xl leading-none">{isOpen ? "−" : "+"}</span>
                </button>
              </h3>
              <div
                id={`svc-panel-${i}`}
                role="region"
                aria-labelledby={`svc-btn-${i}`}
                inert={!isOpen}
                className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  <div className="pb-8 pl-[3.25rem] md:pl-24 md:pr-[10vw]">
                    <p className="max-w-xl text-lg text-paper/85">{s.body}</p>
                    <p className="mt-6 text-sm font-semibold">Consider the journey</p>
                    <p className="mt-1 text-paper/70">{s.points.join(" · ")}</p>
                    <Link href="#contact" className="mt-6 inline-block border-b-2 border-signal pb-1 text-sm font-semibold hover:text-signal">Discuss your shipment ↗</Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
