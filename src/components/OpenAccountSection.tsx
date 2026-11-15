"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useLocale } from "./LocaleProvider";

type IconName = "bolt" | "shield" | "speed" | "support" | "user" | "rocket" | "crown" | "arrow";

const icons: Record<IconName, ReactNode> = {
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
  shield: <><path d="M12 3 19 6v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  speed: <><path d="M5 18a9 9 0 1 1 14 0" /><path d="m12 13 4-5" /><path d="M8 18h8" /></>,
  support: <><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="12" width="4" height="7" rx="2" /><rect x="17" y="12" width="4" height="7" rx="2" /><path d="M17 20h-5" /></>,
  user: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  rocket: <><path d="M14 5c2-2 5-2 5-2s0 3-2 5l-6 6-4-4 7-5Z" /><path d="m7 10-3 1-1 4 5-1m5 1-1 5 4-1 1-3" /><circle cx="15" cy="7" r="1" /><path d="M6 18c-1 1-2 1-3 1 0-1 0-2 1-3" /></>,
  crown: <><path d="m3 8 5 4 4-7 4 7 5-4-2 11H5L3 8Z" /><path d="M5 22h14" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
};

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {icons[name]}
    </svg>
  );
}

const benefits: Array<{ title: string; detail: string; icon: IconName }> = [
  { title: "Secure Access", detail: "Your data protected", icon: "shield" },
  { title: "Fast Setup", detail: "In minutes", icon: "speed" },
  { title: "Dedicated Support", detail: "Always here for you", icon: "support" },
];

const steps: Array<{ title: string; detail: string; icon: IconName }> = [
  { title: "Create Your Account", detail: "Fill in your details in a secure form.", icon: "user" },
  { title: "Verify Your Access", detail: "Confirm your identity and account details.", icon: "shield" },
  { title: "Get Approved", detail: "Our team will review your request manually.", icon: "rocket" },
  { title: "Enjoy Premium Services", detail: "Start using our services: Private Rooms, Copy Trading & Coaching.", icon: "crown" },
];

export default function OpenAccountSection({ signupHref }: { signupHref: string | null }) {
  const { t } = useLocale();
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = section.current;
    if (!root) return;

    const motion = gsap.matchMedia(root);
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-open-account-card]"));
      const cleanups = cards.map((card, index) => {
        const float = gsap.to(card, {
          y: -3,
          duration: 2.8 + (index % 3) * 0.35,
          delay: index * 0.14,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        const activate = () => {
          float.pause();
          gsap.to(card, {
            y: -9,
            scale: 1.035,
            borderColor: "rgb(0 200 117 / 55%)",
            boxShadow: "0 16px 30px rgb(7 30 34 / 11%)",
            duration: 0.28,
            ease: "power3.out",
          });
        };
        const deactivate = () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            duration: 0.38,
            ease: "power2.out",
            onComplete: () => float.restart(),
          });
        };

        card.addEventListener("pointerenter", activate);
        card.addEventListener("pointerleave", deactivate);
        card.addEventListener("focusin", activate);
        card.addEventListener("focusout", deactivate);

        return () => {
          card.removeEventListener("pointerenter", activate);
          card.removeEventListener("pointerleave", deactivate);
          card.removeEventListener("focusin", activate);
          card.removeEventListener("focusout", deactivate);
          float.kill();
        };
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    });

    return () => motion.revert();
  }, []);

  return (
    <section ref={section} id="top" aria-labelledby="open-account-title" className="open-account-section">
      <div className="open-account-inner">
        <div className="open-account-hero">
          <div className="open-account-copy">
            <p className="open-account-badge"><Icon name="bolt" />{t("Get Started")}</p>
            <h1 id="open-account-title">
              {t("Open Your")} <span>{t("Account")}</span>
              <br /><span className="open-account-title-line">{t("and Unlock All Our Services")}</span>
            </h1>
            <p className="open-account-description">{t("Create your account in just a few clicks and gain access to our exclusive trading services: Private Rooms, Copy Trading and Professional Coaching.")}</p>
          </div>

          <div className="open-account-visual">
            <Image
              src="/HERO/Ayoub%20Trader%20Neon%20Trading%20Showcase.png"
              alt="Ayoub Trader account sign-in displayed on a laptop and smartphone"
              fill
              sizes="(max-width: 760px) 100vw, 56vw"
              preload
              className="open-account-device-image"
            />
          </div>

          <div className="open-account-actions">
            <ul className="open-account-benefits">
              {benefits.map((benefit) => (
                <li key={benefit.title} data-open-account-card>
                  <Icon name={benefit.icon} className="open-account-benefit-icon" />
                  <span><strong>{t(benefit.title)}</strong><small>{t(benefit.detail)}</small></span>
                </li>
              ))}
            </ul>
            {signupHref && (
              <a className="open-account-cta" href={signupHref} target="_blank" rel="noopener noreferrer">
                {t("Open My Account")}<Icon name="arrow" />
              </a>
            )}
          </div>
        </div>

        <div className="open-account-process" aria-labelledby="registration-process-title">
          <h2 id="registration-process-title">
            {t("Process prefix")}<span>{t("Registration")}</span>{t("Process suffix")}
          </h2>
          <ol className="open-account-steps">
            {steps.map((step, index) => (
              <li key={step.title} className="open-account-step" data-open-account-card>
                <span className="open-account-step-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="open-account-step-icon"><Icon name={step.icon} /></span>
                <h3>{t(step.title)}</h3>
                <p>{t(step.detail)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}