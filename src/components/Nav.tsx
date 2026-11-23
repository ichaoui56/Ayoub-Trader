"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MENU_LINKS, NAV_LINKS } from "../content";
import { useLocale } from "./LocaleProvider";
import Logo from "./Logo";

export default function Nav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const homeHref = (href: string) => href.startsWith("/") || pathname === "/" ? href : `/${href}`;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = panel.current!;
    const items = () => Array.from(root.querySelectorAll<HTMLElement>("a[href], button"));
    document.body.style.overflow = "hidden";
    items()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
      if (e.key !== "Tab") return;
      const list = items();
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      trigger.current?.focus();
    };
  }, [open]);

  return (
    <>
      <header className={`site-nav fixed inset-x-0 top-0 z-40 text-paper${scrolled ? " site-nav--scrolled" : pathname !== "/" ? " site-nav--interior" : ""}`}>
        <div className="site-nav__inner flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Logo href={pathname === "/" ? "#top" : "/#top"} compact={scrolled} />
          </div>
          <nav aria-label={t("Primary navigation")} className="site-nav__actions">
            <ul className="site-nav__links">
              {NAV_LINKS.map((l) => (
                <li key={l.href}><Link href={homeHref(l.href)} className="hover:text-signal">{t(l.label)}</Link></li>
              ))}
            </ul>
            <Link href={homeHref("#coaching")} className="site-nav__book hidden whitespace-nowrap bg-signal px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-paper transition hover:bg-paper hover:text-ink sm:inline-flex">
              {t("Coaching plans")} <span className="ml-3" aria-hidden="true">↗</span>
            </Link>
            <div className="site-language-switch" role="group" aria-label={t("Choose language")}>
              {(["en", "fr", "ar"] as const).map((option) => (
                <button key={option} type="button" aria-pressed={locale === option} onClick={() => setLocale(option)}>
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              ref={trigger}
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen(true)}
              className="site-nav__menu"
            >
              <span className="md:hidden">{t("Menu")}</span>
              <span className="hidden md:inline 2xl:hidden">{t("Explore")}</span>
              <span className="hidden 2xl:inline">{t("Menu")}</span>
            </button>
          </nav>
        </div>
      </header>

      {open && (
        <div ref={panel} id="site-menu" role="dialog" aria-modal="true" aria-label={t("Site menu")} className="fixed inset-0 z-50 flex flex-col bg-ink px-5 py-4 text-paper md:px-[4vw]">
          <div className="flex h-12 items-center justify-between">
            <Logo href={pathname === "/" ? "#top" : "/#top"} />
            <button type="button" onClick={() => setOpen(false)} className="border border-paper/50 px-4 py-2 text-sm font-semibold hover:border-signal">
              {t("Close")} <span aria-hidden="true">×</span>
            </button>
          </div>
          <ul className="my-auto">
            {MENU_LINKS.map((l) => (
              <li key={l.href} className="border-b border-paper/15">
                <Link href={homeHref(l.href)} onClick={() => setOpen(false)} className="flex items-baseline justify-between gap-4 py-5 font-display text-[clamp(1.8rem,6vw,4rem)] font-extrabold leading-none hover:text-signal">
                  <span>{t(l.label)}</span>
                  <span className="text-sm font-normal text-paper/60">{l.n} ↗</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-sm text-paper/60">{t("Trade with discipline.")}</p>
        </div>
      )}
    </>
  );
}
