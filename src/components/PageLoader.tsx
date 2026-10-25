"use client";

import { useEffect, useState } from "react";

function waitForImage(image: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = async () => {
      if (settled) return;
      settled = true;
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);

      if (image.naturalWidth === 0) {
        console.warn("Could not load page image:", image.currentSrc || image.src);
      } else {
        try {
          await image.decode();
        } catch (error) {
          console.warn("Could not decode page image:", image.currentSrc || image.src, error);
        }
      }

      resolve();
    };

    if (image.complete) {
      void finish();
      return;
    }

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    image.loading = "eager";
  });
}

function waitForVideo(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      video.removeEventListener("loadeddata", finish);
      video.removeEventListener("error", finish);

      if (video.error) {
        console.warn(
          "Could not load the page video:",
          video.currentSrc || video.src,
          video.error.message,
        );
      }

      resolve();
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || video.error) {
      finish();
      return;
    }

    video.addEventListener("loadeddata", finish, { once: true });
    video.addEventListener("error", finish, { once: true });
    video.preload = "auto";
    video.load();
  });
}

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(1);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    let cancelled = false;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;

    document.body.style.overflow = "hidden";

    const images = Array.from(document.images);
    const imageSources = new Set(images.map((image) => image.currentSrc || image.src));
    const posterImages = Array.from(document.querySelectorAll("video[poster]"))
      .map((video) => (video as HTMLVideoElement).poster)
      .filter((poster) => poster && !imageSources.has(poster))
      .map((poster) => {
        const image = new Image();
        image.loading = "eager";
        image.src = poster;
        return image;
      });
    const videos = Array.from(document.querySelectorAll("video"));

    // The scroll-driven hero only needs its first decoded frame, not the entire video download.
    const resources = [
      ...images.map(waitForImage),
      ...posterImages.map(waitForImage),
      ...videos.map(waitForVideo),
      document.fonts.ready.then(() => undefined),
    ];
    const exitDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 1400;

    setTotal(resources.length);

    void Promise.all(
      resources.map((resource) =>
        resource.then(() => {
          if (!cancelled) setCompleted((count) => count + 1);
        }),
      ),
    ).then(() => {
      if (cancelled) return;

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

  const progress = Math.round((completed / total) * 100);

  return (
    <div
      className={`page-loader${leaving ? " page-loader--leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={leaving ? "Your journey is ready" : "Loading the website"}
    >
      <div className="page-loader__cloud page-loader__cloud--one" aria-hidden="true" />
      <div className="page-loader__cloud page-loader__cloud--two" aria-hidden="true" />
      <div className="page-loader__cloud page-loader__cloud--three" aria-hidden="true" />
      <div className="page-loader__cloud page-loader__cloud--four" aria-hidden="true" />

      <div className="page-loader__content">
        <p className="page-loader__eyebrow">Morocco Journeys</p>
        <p className="page-loader__title">
          {leaving ? "Your journey awaits." : "Preparing your journey."}
        </p>
        <div
          className="page-loader__track"
          role="progressbar"
          aria-label="Loading page media"
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
