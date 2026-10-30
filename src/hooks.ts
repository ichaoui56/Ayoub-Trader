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

  useEffect(() => {
    if (!enabled) return;
    const area = runway.current;
    const v = video.current;
    if (!area || !v) return;

    let raf = 0;
    let target = 0;
    let current = 0;
    let last = -1;
    let desiredTime = 0;

    const measure = () => {
      const max = area.offsetHeight - window.innerHeight;
      target = max > 0 ? clamp(-area.getBoundingClientRect().top / max) : 0;
    };

    const frame = () => {
      raf = 0;
      current += (target - current) * 0.3;
      if (Math.abs(target - current) < 0.0004) current = target;

      if (Number.isFinite(v.duration) && v.duration > 0) {
        desiredTime = current * Math.max(v.duration - 0.04, 0);
        if (!v.seeking && Math.abs(v.currentTime - desiredTime) > 1 / 30) {
          v.currentTime = desiredTime;
        }
      }
      if (Math.abs(current - last) > 0.0004 || current === target) {
        if (current !== last) setProgress(current);
        last = current;
      }
      if (current !== target) raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      measure();
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const stop = () => v.pause();

    v.pause();
    v.addEventListener("play", stop);
    v.addEventListener("loadedmetadata", kick);
    v.addEventListener("loadeddata", kick);
    v.addEventListener("canplay", kick);
    v.addEventListener("seeked", kick);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    window.addEventListener("pageshow", kick);
    document.addEventListener("visibilitychange", kick);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("play", stop);
      v.removeEventListener("loadedmetadata", kick);
      v.removeEventListener("loadeddata", kick);
      v.removeEventListener("canplay", kick);
      v.removeEventListener("seeked", kick);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      window.removeEventListener("pageshow", kick);
      document.removeEventListener("visibilitychange", kick);
    };
  }, [runway, video, enabled]);

  return progress;
}
