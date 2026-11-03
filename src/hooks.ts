import { useEffect, useState, type RefObject } from "react";

export const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/** 1 while `p` is inside [from, to], easing in/out over `fade`. */
export const windowOpacity = (p: number, from: number, to: number, fade = 0.025) =>
  clamp(Math.min((p - from) / fade + 0.0001, (to - p) / fade));

export function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * Maps scroll position inside `runway` to video time and returns eased film progress (0–1).
 * The video is never played; currentTime is driven forward and in reverse.
 */
export function useScrollFilm(
  runway: RefObject<HTMLElement | null>,
  video: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const [progress, setProgress] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const area = runway.current;
    const v = video.current;
    if (!area || !v) return;

    let raf = 0;
    let target = 0;
    let current = 0;
    let last = -1;
    let lastRenderAt = 0;
    let desiredTime = 0;
    let mediaReady = false;

    const updateLoadProgress = () => {
      const duration = v.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      let bufferedDuration = 0;
      for (let index = 0; index < v.buffered.length; index += 1) {
        bufferedDuration += v.buffered.end(index) - v.buffered.start(index);
      }

      const startsAtBeginning = v.buffered.length > 0 && v.buffered.start(0) <= 0.05;
      const reachesEnd = v.buffered.length > 0 && v.buffered.end(v.buffered.length - 1) >= duration - 0.1;
      const isFullyBuffered = startsAtBeginning && reachesEnd && bufferedDuration >= duration - 0.1;
      const nextProgress = isFullyBuffered ? 1 : Math.min(Math.floor(clamp(bufferedDuration / duration) * 100) / 100, 0.99);

      mediaReady = isFullyBuffered;
      setLoadProgress(nextProgress);
    };

    const measure = () => {
      const max = area.offsetHeight - window.innerHeight;
      target = max > 0 ? clamp(-area.getBoundingClientRect().top / max) : 0;
    };

    const frame = (timestamp: number) => {
      raf = 0;
      current += (target - current) * (target < current ? 0.62 : 0.3);
      if (Math.abs(target - current) < 0.0004) current = target;

      if (mediaReady && Number.isFinite(v.duration) && v.duration > 0) {
        desiredTime = current * Math.max(v.duration - 0.04, 0);
        if (!v.seeking && Math.abs(v.currentTime - desiredTime) >= 1 / 24) {
          v.currentTime = desiredTime;
        }
      }
      if (Math.abs(current - last) > 0.0004 || current === target) {
        if (current !== last && (timestamp - lastRenderAt >= 1000 / 30 || current === target)) {
          setProgress(current);
          last = current;
          lastRenderAt = timestamp;
        }
      }
      if (current !== target) raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      measure();
      if (enabled && !raf) raf = requestAnimationFrame(frame);
    };
    const stop = () => v.pause();
    const onMediaError = () => setLoadError(true);

    v.pause();
    v.addEventListener("play", stop);
    v.addEventListener("loadedmetadata", updateLoadProgress);
    v.addEventListener("durationchange", updateLoadProgress);
    v.addEventListener("progress", updateLoadProgress);
    v.addEventListener("loadeddata", updateLoadProgress);
    v.addEventListener("canplay", updateLoadProgress);
    v.addEventListener("canplaythrough", updateLoadProgress);
    v.addEventListener("error", onMediaError);
    if (enabled) {
      v.addEventListener("seeked", kick);
      window.addEventListener("scroll", kick, { passive: true });
      window.addEventListener("resize", kick);
      window.addEventListener("pageshow", kick);
      document.addEventListener("visibilitychange", kick);
      kick();
    }
    updateLoadProgress();

    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("play", stop);
      v.removeEventListener("loadedmetadata", updateLoadProgress);
      v.removeEventListener("durationchange", updateLoadProgress);
      v.removeEventListener("progress", updateLoadProgress);
      v.removeEventListener("loadeddata", updateLoadProgress);
      v.removeEventListener("canplay", updateLoadProgress);
      v.removeEventListener("canplaythrough", updateLoadProgress);
      v.removeEventListener("error", onMediaError);
      v.removeEventListener("seeked", kick);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      window.removeEventListener("pageshow", kick);
      document.removeEventListener("visibilitychange", kick);
    };
  }, [runway, video, enabled]);

  return { progress, loadProgress, loadError };
}
