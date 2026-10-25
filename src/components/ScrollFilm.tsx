"use client";

import Link from "next/link";
import { useRef } from "react";
import { CHAPTERS, MEDIA } from "../content";
import { clamp, usePrefersReducedMotion, useScrollFilm, windowOpacity } from "../hooks";
import Chapter from "./Chapter";

function HeroCopy({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      className="hero-copy absolute inset-x-5 top-[54%] text-paper md:left-[7vw] md:right-auto md:max-w-[min(58vw,58rem)]"
      style={{ opacity, transform: `translateY(calc(-50% + ${(1 - opacity) * -20}px))` }}
    >
      <p className="mb-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-paper/90 md:mb-6">
        <span className="h-px w-7 bg-signal" /> Travel / Concierge
      </p>
      <h1 className="font-display text-[clamp(3rem,7.2vw,7.6rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.045em]">
        <span className="block whitespace-nowrap">Your Morocco</span>
        <span className="block whitespace-nowrap"><span className="text-signal">Adventure</span> starts</span>
        <span className="block whitespace-nowrap">the moment you</span>
        <span className="block text-signal">land.</span>
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/90 [text-shadow:0_1px_8px_rgb(0_0_0/35%)] md:mt-7 md:text-base">
        Seamless airport pickup, handpicked stays and unforgettable experiences—all in one premium concierge service.
      </p>
      <Link href="#transfer" className="mt-6 inline-flex items-center gap-5 bg-signal px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-paper transition-colors hover:bg-paper hover:text-ink md:mt-8">
        Plan your arrival <span aria-hidden="true">↓</span>
      </Link>
    </div>
  );
}

export default function ScrollFilm() {
  const reduced = usePrefersReducedMotion();
  const runway = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const p = useScrollFilm(runway, video, !reduced);

  if (reduced) {
    return (
      <section id="top" aria-label="Morocco Journeys introduction" className="bg-ink">
        <div className="relative min-h-svh overflow-hidden">
          <img src={MEDIA.poster} alt="An aerial view of a private car approaching a Moroccan resort" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/20 to-ink/5" />
          <HeroCopy />
        </div>
        <div className="grid gap-12 px-5 py-20 md:grid-cols-3 md:px-[6vw]">
          {CHAPTERS.map((c) => (
            <div key={c.id} className="text-paper"><Chapter chapter={c} /></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="top" ref={runway} aria-label="Morocco travel film, scrubbed by scrolling" className="relative h-[520svh] bg-ink md:h-[600svh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <video
          ref={video}
          src={MEDIA.film}
          poster={MEDIA.poster}
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
          disablePictureInPicture
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/65 via-ink/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-ink/20" />
        <div className="absolute inset-x-0 top-0 z-10 h-[2px] bg-paper/20">
          <div className="h-full origin-left bg-signal" style={{ transform: `scaleX(${p})` }} />
        </div>

        <HeroCopy opacity={clamp((0.11 - p) / 0.04)} />

        {CHAPTERS.map((c) => {
          const o = windowOpacity(p, c.from, c.to);
          return (
            <div key={c.id} className={`absolute text-paper ${c.pos}`} style={{ opacity: o, transform: `translateY(${(1 - o) * 18}px)` }}>
              <Chapter chapter={c} />
            </div>
          );
        })}

        <div className="absolute bottom-6 left-5 flex items-center gap-3 text-xs text-paper/80 md:left-[6vw]" style={{ opacity: clamp((0.06 - p) / 0.03) }}>
          <span className="block h-px w-10 bg-signal" /> Scroll to explore Morocco
        </div>
        <p className="absolute bottom-6 right-5 hidden text-right text-xs text-paper/70 md:block md:right-[4vw]">
          Morocco Journeys.<br />Every arrival, considered.
        </p>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-cloud" style={{ opacity: clamp((p - 0.82) / 0.18) }} />
      </div>
    </section>
  );
}
