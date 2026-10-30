import Link from "next/link";
import Logo from "./Logo";
import { translate, type Locale } from "../i18n";

export default function FinalCallToAction({ locale }: { locale: Locale }) {
  const t = (phrase: string) => translate(locale, phrase);
  return (
    <section id="contact" className="travel-section pb-8 pt-12">
      <div className="flex flex-col gap-7 border-b border-ink/15 pb-9 md:flex-row md:items-center md:justify-between">
        <h2 className="section-title max-w-2xl">
          {t("Let’s make your arrival")}<br /><span className="text-signal">{t("unforgettable.")}</span>
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="#transfer" className="button-signal">{t("Reserve your pickup")} <span aria-hidden="true">→</span></Link>
          <Link href="/blog" className="button-outline">{t("Read the journal")} <span aria-hidden="true">→</span></Link>
        </div>
      </div>
      <footer className="flex flex-col gap-5 pt-6 text-xs text-ink/60 md:flex-row md:items-center md:justify-between">
        <Logo className="text-ink" />
        <nav aria-label={t("Footer navigation")} className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="#transfer">{t("Airport transfers")}</Link>
          <Link href="#stays">{t("Places to stay")}</Link>
          <Link href="#experiences">{t("Experiences")}</Link>
          <Link href="#concierge">{t("Notre Histoire")}</Link>
          <Link href="/blog">{t("Travel journal")}</Link>
        </nav>
        <p>{t("More than a trip. A journey.")}</p>
      </footer>
    </section>
  );
}
