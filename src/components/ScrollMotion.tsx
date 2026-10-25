"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const media = gsap.matchMedia(element);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((item) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 88%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-frame]").forEach((frame) => {
        const image = frame.querySelector<HTMLElement>("[data-frame-image]");
        gsap.fromTo(
          frame,
          { clipPath: "inset(10% 7% 10% 7%)", y: 26 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            y: 0,
            duration: 1.05,
            ease: "power3.out",
            scrollTrigger: { trigger: frame, start: "top 88%", once: true },
          },
        );
        if (image) {
          gsap.fromTo(
            image,
            { scale: 1.1 },
            {
              scale: 1,
              duration: 1.35,
              ease: "power2.out",
              scrollTrigger: { trigger: frame, start: "top 88%", once: true },
            },
          );
        }
      });

      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        const cards = group.querySelectorAll<HTMLElement>("[data-card]");
        gsap.fromTo(
          cards,
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.11,
            ease: "power3.out",
            scrollTrigger: { trigger: group, start: "top 82%", once: true },
          },
        );
      });
    });

    return () => media.revert();
  }, []);

  return <div ref={root}>{children}</div>;
}
