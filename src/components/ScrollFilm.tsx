"use client";

import Link from "next/link";
import { useRef } from "react";
import { CHAPTERS, MEDIA } from "../content";
import { clamp, usePrefersReducedMotion, useScrollFilm, windowOpacity } from "../hooks";
import Chapter from "./Chapter";
import { translate, type Locale } from "../i18n";
import { useLocale } from "./LocaleProvider";

function HeroCopy({ opacity = 1 }: { opacity?: number }) {
  const { t } = useLocale();
  return (
    <div
      className="hero-copy absolute inset-x-5 top-[54%] text-paper md:left-[7vw] md:right-auto"
      style={{ opacity, transform: `translateY(calc(-50% + ${(1 - opacity) * -20}px))` }}
    >
      <p className="mb-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-paper/90 md:mb-6">
        <span className="h-px w-7 bg-signal" /> {t("Trading education")}
      </p>
      <h2 className="hero-title font-display font-extrabold uppercase">
        <span className="block whitespace-nowrap">{t("Build skill.")}</span>
        <span className="block whitespace-nowrap text-signal">{t("Trade with")}</span>
        <span className="block whitespace-nowrap">{t("a clear plan.")}</span>
        <span className="block whitespace-nowrap text-signal">{t("Stay disciplined.")}</span>
      </h2>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/90 [text-shadow:0_1px_8px_rgb(0_0_0/35%)] md:mt-7 md:text-base">
        {t("Coaching, private community access, and broker-authorized copy trading. Every application is reviewed before access is activated.")}
      </p>
      <Link href="/coaching" className="mt-6 inline-flex items-center gap-5 bg-signal px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-paper transition-colors hover:bg-paper hover:text-ink md:mt-8">
        {t("Explore coaching")} <span aria-hidden="true">↓</span>
      </Link>
    </div>
  );
}

export default function ScrollFilm({ locale }: { locale: Locale }) {
  const { t } = useLocale();
  const reduced = usePrefersReducedMotion();
  const runway = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { progress: p, loadProgress, loadDeterminate, loadError } = useScrollFilm(runway, video, MEDIA.film, !reduced);
  const chapters = CHAPTERS.map((chapter) => ({
    ...chapter,
    kicker: translate(locale, chapter.kicker),
    title: translate(locale, chapter.title),
    body: translate(locale, chapter.body),
  }));

  if (reduced) {
    return (
      <section id="market-intro" aria-label="Ayoub Trader introduction" className="bg-ink">
        <div className="relative min-h-svh overflow-hidden">
          <img src={MEDIA.poster} alt="Ayoub Trader logo" className="absolute inset-0 h-full w-full bg-ink object-contain p-8" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/25 to-transparent" />
          <HeroCopy />
        </div>
        <div className="grid gap-12 px-5 py-20 md:grid-cols-3 md:px-[6vw]">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="text-paper"><Chapter chapter={chapter} /></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="market-intro" ref={runway} aria-label="Ayoub Trader film, scrubbed by scrolling" className="relative h-[320svh] bg-ink md:h-[400svh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <video
          ref={video}
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
        {loadProgress < 1 && !loadError && (
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-ink/55 px-6 text-paper backdrop-blur-[2px]" role="status" aria-live="polite" aria-label={`Preparing trading film: ${Math.round(loadProgress * 100)}%`}>
            <div className="w-full max-w-xs">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]">Preparing the film</p>
              <div
                className="mt-4 h-px bg-paper/30"
                role="progressbar"
                aria-label="Film loading progress"
                aria-valuemin={loadDeterminate ? 0 : undefined}
                aria-valuemax={loadDeterminate ? 100 : undefined}
                aria-valuenow={loadDeterminate ? Math.round(loadProgress * 100) : undefined}
              >
                <div
                  className={`h-full origin-left bg-signal ${loadDeterminate ? "transition-[width] duration-300" : "w-1/3 animate-pulse"}`}
                  style={loadDeterminate ? { width: `${loadProgress * 100}%` } : undefined}
                />
              </div>
              <p className="mt-3 flex justify-between text-xs text-paper/80">
                <span>Loading full film</span>
                {loadDeterminate && <span>{Math.round(loadProgress * 100)}%</span>}
              </p>
            </div>
          </div>
        )}
        {loadError && (
          <p className="absolute bottom-5 right-5 z-20 text-xs text-paper/80">{t("Film unavailable; showing Ayoub Trader mark")}</p>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-ink/20" />
        <div className="absolute inset-x-0 top-0 z-10 h-[2px] bg-paper/20">
          <div className="h-full origin-left bg-signal" style={{ transform: `scaleX(${p})` }} />
        </div>

        <HeroCopy opacity={clamp((0.11 - p) / 0.04)} />

        {chapters.map((c) => {
          const o = windowOpacity(p, c.from, c.to);
          return (
            <div key={c.id} className={`absolute text-paper ${c.pos}`} style={{ opacity: o, transform: `translateY(${(1 - o) * 18}px)` }}>
              <Chapter chapter={c} />
            </div>
          );
        })}

        <div className="hero-scroll-hint absolute bottom-6 left-5 flex items-center gap-3 text-xs text-paper/80 md:left-[6vw]" style={{ opacity: clamp((0.06 - p) / 0.03) }}>
          <span className="block h-px w-10 bg-signal" /> {t("Scroll to explore")}
        </div>
        <p className="absolute bottom-6 right-5 hidden text-right text-xs text-paper/70 md:block md:right-[4vw]">
          Ayoub Trader.<br />{t("Trade with discipline.")}
        </p>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-cloud" style={{ opacity: clamp((p - 0.82) / 0.18) }} />
      </div>
    </section>
  );
}
