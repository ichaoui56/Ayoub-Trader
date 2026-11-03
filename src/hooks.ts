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
  source: string,
  enabled: boolean,
) {
  const [progress, setProgress] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadDeterminate, setLoadDeterminate] = useState(false);
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
    let objectUrl: string | null = null;
    const controller = new AbortController();

    const onLoadedData = () => {
      mediaReady = true;
      setLoadDeterminate(true);
      setLoadProgress(1);
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
    const loadFilm = async () => {
      try {
        const response = await fetch(source, { signal: controller.signal });
        if (!response.ok) throw new Error(`Film request failed: ${response.status}`);

        const total = Number(response.headers.get("content-length"));
        const hasContentLength = Number.isFinite(total) && total > 0;
        setLoadDeterminate(hasContentLength);
        const chunks: BlobPart[] = [];
        let loaded = 0;

        if (response.body) {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.byteLength;
            if (hasContentLength) {
              setLoadProgress(Math.min(Math.floor((loaded / total) * 100) / 100, 0.99));
            }
          }
        } else {
          chunks.push(await response.blob());
          if (hasContentLength) setLoadProgress(0.99);
        }

        const blob = new Blob(chunks, { type: response.headers.get("content-type") || "video/mp4" });
        objectUrl = URL.createObjectURL(blob);
        v.src = objectUrl;
        v.load();
      } catch {
        if (!controller.signal.aborted) setLoadError(true);
      }
    };

    v.pause();
    v.addEventListener("play", stop);
    v.addEventListener("loadeddata", onLoadedData);
    v.addEventListener("error", onMediaError);
    if (enabled) {
      v.addEventListener("seeked", kick);
      window.addEventListener("scroll", kick, { passive: true });
      window.addEventListener("resize", kick);
      window.addEventListener("pageshow", kick);
      document.addEventListener("visibilitychange", kick);
      kick();
    }
    void loadFilm();

    return () => {
      cancelAnimationFrame(raf);
      controller.abort();
      v.removeEventListener("play", stop);
      v.removeEventListener("loadeddata", onLoadedData);
      v.removeEventListener("error", onMediaError);
      v.removeEventListener("seeked", kick);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      window.removeEventListener("pageshow", kick);
      document.removeEventListener("visibilitychange", kick);
      v.removeAttribute("src");
      v.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [runway, video, source, enabled]);

  return { progress, loadProgress, loadDeterminate, loadError };
}
