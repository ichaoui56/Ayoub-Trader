"use client";

import { useEffect, useState } from "react";

function waitForImage(image: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);

      if (image.naturalWidth === 0) {
        console.warn("Could not load page image:", image.currentSrc || image.src);
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
    timeout = setTimeout(() => {
      console.warn(
        "A page image is taking too long to load; showing the page while it continues in the background:",
        image.currentSrc || image.src,
      );
      finish();
    }, 12_000);
  });
}

function waitForVideo(
  video: HTMLVideoElement,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let progressTimer: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (progressTimer) clearInterval(progressTimer);
      if (timeout) clearTimeout(timeout);
      video.removeEventListener("loadedmetadata", checkProgress);
      video.removeEventListener("durationchange", checkProgress);
      video.removeEventListener("progress", checkProgress);
      video.removeEventListener("loadeddata", checkProgress);
      video.removeEventListener("canplaythrough", checkProgress);
      video.removeEventListener("suspend", checkProgress);
      video.removeEventListener("error", finish);

      if (video.error) {
        console.warn(
          "Could not load the page video:",
          video.currentSrc || video.src,
          video.error.message,
        );
      }

      onProgress(1);
      resolve();
    };

    const checkProgress = () => {
      if (video.error) {
        finish();
        return;
      }

      const duration = video.duration;
      let bufferedUntil = 0;

      if (Number.isFinite(duration) && duration > 0) {
        for (let index = 0; index < video.buffered.length; index += 1) {
          const start = video.buffered.start(index);
          const end = video.buffered.end(index);
          if (start > bufferedUntil + 0.1) break;
          bufferedUntil = Math.max(bufferedUntil, end);
        }

        const progress = Math.min(bufferedUntil / duration, 0.99);
        onProgress(progress);

        if (
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          bufferedUntil >= duration - 0.1
        ) {
          finish();
        }
      }
    };

    if (video.error) {
      finish();
      return;
    }

    video.addEventListener("loadedmetadata", checkProgress);
    video.addEventListener("durationchange", checkProgress);
    video.addEventListener("progress", checkProgress);
    video.addEventListener("loadeddata", checkProgress);
    video.addEventListener("canplaythrough", checkProgress);
    video.addEventListener("suspend", checkProgress);
    video.addEventListener("error", finish, { once: true });
    video.preload = "auto";
    video.load();
    checkProgress();
    if (!settled) progressTimer = setInterval(checkProgress, 250);
    if (!settled) {
      timeout = setTimeout(() => {
        console.warn(
          "The page video is taking too long to load; showing the page while it continues in the background:",
          video.currentSrc || video.src,
        );
        finish();
      }, 12_000);
    }
  });
}

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
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
      document.fonts.ready.then(() => undefined),
    ];
    const exitDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 1400;

    setTotal(resources.length + videos.length || 1);

    void Promise.all(
      [
        ...resources.map((resource) =>
          resource.then(() => {
            if (!cancelled) setCompleted((count) => count + 1);
          }),
        ),
        ...videos.map((video) =>
          waitForVideo(video, (progress) => {
            if (!cancelled) setVideoProgress(progress);
          }),
        ),
      ],
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

  const progress = Math.round(Math.min((completed + videoProgress) / total, 1) * 100);

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
