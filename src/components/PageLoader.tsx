"use client";

import { useEffect, useState } from "react";

function waitForFirstVideoFrame(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      video.removeEventListener("loadeddata", checkReady);
      video.removeEventListener("error", finish);
      resolve();
    };

    const checkReady = () => {
      if (video.error || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        finish();
      }
    };

    video.addEventListener("loadeddata", checkReady);
    video.addEventListener("error", finish, { once: true });
    checkReady();
    if (!settled) timeout = setTimeout(finish, 350);
  });
}

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    let cancelled = false;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;

    document.body.style.overflow = "hidden";

    const video = document.querySelector<HTMLVideoElement>("#top video");
    const exitDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 220;

    void (video ? waitForFirstVideoFrame(video) : Promise.resolve()).then(() => {
      if (cancelled) return;

      setCompleted(1);
      setLeaving(true);
      exitTimer = setTimeout(() => {
        setVisible(false);
        document.body.style.overflow = previousOverflow;
      }, exitDuration);
    });

    return () => {
      cancelled = true;
      if (exitTimer) clearTimeout(exitTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!visible) return null;

  const progress = completed * 100;

  return (
    <div
      className={`page-loader${leaving ? " page-loader--leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={leaving ? "Ayoub Trader is ready" : "Loading the trading film"}
    >
      <div className="page-loader__cloud page-loader__cloud--one" aria-hidden="true" />
      <div className="page-loader__cloud page-loader__cloud--two" aria-hidden="true" />
      <div className="page-loader__cloud page-loader__cloud--three" aria-hidden="true" />
      <div className="page-loader__cloud page-loader__cloud--four" aria-hidden="true" />

      <div className="page-loader__content">
        <p className="page-loader__eyebrow">Ayoub Trader</p>
        <p className="page-loader__title">
          {leaving ? "Trade with discipline." : "Preparing your trading film."}
        </p>
        <div
          className="page-loader__track"
          role="progressbar"
          aria-label="Loading the trading film"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <p className="page-loader__percentage">{progress}%</p>
      </div>
    </div>
  );
}
