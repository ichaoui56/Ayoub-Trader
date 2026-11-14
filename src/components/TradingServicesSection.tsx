"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const services = [
  {
    n: "01",
    name: "Private rooms",
    description: "Broker registration, deposit review and manually activated VIP access.",
    href: "/private-rooms",
    detail: "$80 / 2 months",
    category: "Community",
    image: "/private-rooms.png",
    benefits: ["Exclusive community access", "VIP benefits & support", "Personalized guidance"],
  },
  {
    n: "02",
    name: "Copy trading",
    description: "A secure, broker-authorized connection. Never send account credentials by form or chat.",
    href: "/copy-trading",
    detail: "50% profit share",
    category: "Broker connected",
    image: "/copy-trading.png",
    benefits: ["Mirror top traders", "Automated execution", "Full transparency"],
  },
  {
    n: "03",
    name: "Online coaching",
    description: "One-to-one video sessions with a recurring daily time reserved for the month.",
    href: "/coaching",
    detail: "From 1,500 DH",
    category: "Education",
    image: "/online-coaching.png",
    benefits: ["Personalized sessions", "Expert strategies", "Real market insights"],
  },
];

export default function TradingServicesSection() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = section.current;
    if (!root) return;

    const shells = Array.from(root.querySelectorAll<HTMLElement>("[data-service-shell]"));
    const cards = shells.flatMap((shell) => {
      const card = shell.querySelector<HTMLElement>("[data-service-card]");
      return card ? [{ shell, card }] : [];
    });
    const media = gsap.matchMedia(root);

    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(cards.map(({ card }) => card), { transformOrigin: "center center", force3D: true });
      const pointerMotion = cards.map(({ shell, card }) => ({
        shell,
        card,
        spotlight: card.querySelector<HTMLElement>("[data-card-spotlight]"),
        art: card.querySelector<HTMLElement>("[data-card-art]"),
      }));

      const setEmphasis = (activeIndex: number) => {
        gsap.to(cards.map(({ card }) => card), {
          y: (index) => activeIndex === index ? -9 : 0,
          scale: (index) => activeIndex === index ? 1.025 : 0.99,
          opacity: 1,
          boxShadow: (index) => activeIndex === index
            ? "0 30px 60px rgb(6 45 48 / 20%), 0 0 0 1px rgb(7 150 83 / 30%)"
            : "0 12px 32px rgb(6 45 48 / 7%)",
          zIndex: (index) => activeIndex === index ? 3 : 1,
          duration: 0.48,
          ease: "power3.out",
        });
        pointerMotion.forEach(({ shell, card, spotlight, art }, index) => {
          if (!shell.matches(":hover")) {
            gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.55, ease: "elastic.out(1, 0.65)", overwrite: "auto" });
            gsap.to(art, { x: 0, y: 0, duration: 0.55, ease: "power3.out", overwrite: "auto" });
            gsap.to(spotlight, { opacity: index === activeIndex ? 0.4 : 0, duration: 0.3, overwrite: "auto" });
          }
        });
      };

      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        const shell = event.currentTarget as HTMLElement;
        const index = shells.indexOf(shell);
        const motion = pointerMotion[index];
        const bounds = shell.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        gsap.to(motion.card, {
          rotationX: (0.5 - y) * 9,
          rotationY: (x - 0.5) * 10,
          transformPerspective: 1200,
          duration: 0.45,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(motion.art, {
          x: (x - 0.5) * 12,
          y: (y - 0.5) * 12,
          duration: 0.55,
          ease: "power2.out",
          overwrite: "auto",
        });
        motion.spotlight?.style.setProperty("--spot-x", `${x * 100}%`);
        motion.spotlight?.style.setProperty("--spot-y", `${y * 100}%`);
        gsap.to(motion.spotlight, { opacity: 1, duration: 0.3, overwrite: "auto" });
      };

      let syncFrame = 0;
      const syncEmphasis = () => {
        cancelAnimationFrame(syncFrame);
        syncFrame = requestAnimationFrame(() => {
          const activeIndex = shells.findIndex((shell) => shell.matches(":hover") || shell.contains(document.activeElement));
          setEmphasis(activeIndex);
        });
      };

      shells.forEach((shell) => {
        shell.addEventListener("pointerenter", syncEmphasis);
        shell.addEventListener("pointermove", onPointerMove);
        shell.addEventListener("pointerleave", syncEmphasis);
        shell.addEventListener("focusin", syncEmphasis);
        shell.addEventListener("focusout", syncEmphasis);
      });

      return () => {
        cancelAnimationFrame(syncFrame);
        shells.forEach((shell) => {
          shell.removeEventListener("pointerenter", syncEmphasis);
          shell.removeEventListener("pointermove", onPointerMove);
          shell.removeEventListener("pointerleave", syncEmphasis);
          shell.removeEventListener("focusin", syncEmphasis);
          shell.removeEventListener("focusout", syncEmphasis);
        });
      };
    });

    return () => media.revert();
  }, []);

  return (
    <section ref={section} id="services" className="relative overflow-hidden bg-[#F5F9F5] px-5 py-20 md:px-10 md:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'url("/Minimalist%20Green%20Growth%20World%20Map%20Background.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-ink/15 pb-8 md:pb-10">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#079653]"><span className="h-px w-8 bg-[#079653]" /> Ways to work together</p>
            <h2 className="mt-5 max-w-3xl font-display text-5xl font-extrabold uppercase leading-[0.88] text-[#062D30] sm:text-6xl md:text-7xl">One market.<br /><span className="text-[#079653]">Three paths.</span></h2>
            <div aria-hidden="true" className="mt-4 h-[3px] w-24 rounded-full bg-gradient-to-r from-[#079653] to-[#10B981]" />
          </div>
          <p className="mb-1 max-w-md border-l-2 border-[#079653] pl-5 text-sm leading-6 text-[#718078] md:text-base">Choose the support that fits your goals. Account access and service activation are always reviewed manually.</p>
        </div>

        <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2 xl:grid-cols-3" style={{ perspective: "1200px" }}>
          {services.map((service) => (
            <div key={service.href} data-service-shell className="trading-service-shell group relative min-h-[420px] last:md:col-span-2 last:md:mx-auto last:md:w-full last:md:max-w-[calc(50%_-_0.5rem)] xl:last:col-span-1 xl:last:max-w-none">
              <Link
                href={service.href}
                data-service-card
                className="trading-service-card relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-[22px] border border-[#DDEBE3] bg-white/95 p-6 shadow-[0_12px_32px_rgb(6_45_48/7%)] outline-none backdrop-blur-sm transition-[border-color,outline-color,box-shadow] duration-300 group-hover:border-[#079653] group-hover:border-2 group-hover:shadow-[0_20px_44px_rgb(6_45_48/13%)] group-focus-within:border-[#079653] group-focus-within:border-2 focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F5F9F5] md:p-7"
                style={{ transformStyle: "preserve-3d", transformOrigin: "center center" }}
              >
              <span
                data-card-spotlight
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 opacity-0"
                style={{ background: "radial-gradient(300px circle at var(--spot-x, 50%) var(--spot-y, 45%), rgb(16 185 129 / 13%), transparent 72%)" }}
              />
              <div className="relative z-10 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#079653] font-display text-sm font-bold text-white shadow-[0_5px_12px_rgb(7_150_83/20%)]">{service.n}</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#718078]">{service.category}</span>
                <span aria-hidden="true" className="h-px w-8 bg-[#079653]/30" />
              </div>
              <div className="relative z-10 mt-5 grid grid-cols-[minmax(0,1fr)_minmax(112px,0.8fr)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(144px,0.8fr)] sm:gap-4">
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-extrabold uppercase leading-[0.95] text-[#062D30] sm:text-3xl">{service.name}</h3>
                  <p className="mt-3 text-[13px] leading-5 text-[#718078]">{service.description}</p>
                </div>
                <div data-card-art aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[190px]">
                  <span className="absolute left-1/2 top-1/2 aspect-square w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#079653]/20 bg-gradient-to-br from-white via-[#E6F5ED] to-[#D4F1E1] shadow-[inset_0_2px_12px_rgb(255_255_255/80%),0_10px_28px_rgb(7_150_83/12%)]" />
                  <span className="absolute left-1/2 top-1/2 aspect-square w-[96%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#10B981]/10" />
                  <span className="absolute left-1/2 top-1/2 aspect-square w-[65%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#10B981]/15 blur-2xl" />
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    sizes="(max-width: 639px) 36vw, (max-width: 1279px) 22vw, 14vw"
                    className="z-10 object-contain p-1 drop-shadow-[0_8px_14px_rgba(6,45,48,0.18)] transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  />
                </div>
              </div>
              <ul className="relative z-10 mt-5 space-y-2 text-xs font-medium text-[#42574D]">
                  {service.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#079653] text-[10px] font-bold leading-none text-white">✓</span>
                      {benefit}
                    </li>
                  ))}
              </ul>
              <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#062D30]/10 pt-4">
                  <span className="inline-flex min-h-10 items-center rounded-full bg-[#062D30] px-4 font-display text-base font-bold text-white sm:text-lg">{service.detail}</span>
                  <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#42574D] transition-colors duration-300 group-hover:text-[#079653] group-focus-visible:text-[#079653]">Explore <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E6F5ED] text-sm text-[#062D30] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:bg-[#10B981] group-hover:text-white motion-reduce:transition-none">↗</span></span>
              </div>
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 border-t border-[#062D30]/10 pt-4 text-xs text-[#718078]"><span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#079653] text-[10px] font-bold text-white">i</span>No online payment is taken. Requests are confirmed only after manual review.</p>
      </div>
    </section>
  );
}