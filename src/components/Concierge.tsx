import Link from "next/link";
import { translate, type Locale } from "../i18n";

export default function Concierge({ locale }: { locale: Locale }) {
  const t = (phrase: string) => translate(locale, phrase);
  return (
    <section id="concierge" className="story-section">
      <div className="story-section__inner">
        <div className="story-section__topline">
          <p className="eyebrow">{t("Notre Histoire")}</p>
          <span aria-hidden="true">{t("EST. WITH CARE · MOROCCO")}</span>
        </div>

        <div className="story-section__layout">
          <div className="story-section__visual" data-reveal>
            <figure className="story-section__image">
              <img
                src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1500&q=85"
                alt="A warm sunset over the rooftops and minarets of a Moroccan city"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <span>{t("MADE FOR THE WAY YOU TRAVEL")}</span>
                <strong>{t("Morocco, a little closer.")}</strong>
              </figcaption>
            </figure>
            <div className="story-section__seal" aria-hidden="true">
                <span>{t("LOCAL")}</span><span>{t("HEART")}</span><span>{t("OPEN")}</span><span>{t("ROADS")}</span>
            </div>
            <div className="story-section__image-index"><span>01</span> / A DIFFERENT KIND OF JOURNEY</div>
          </div>

          <div className="story-section__copy" data-reveal>
            <p className="story-section__kicker"><span /> {t("BUILT AROUND YOU")}</p>
            <h2>
              {t("Your trip.")}<br />
              {t("Your pace.")}<br />
              {t("Your kind of")} <span>{t("Morocco.")}</span>
            </h2>
            <p className="story-section__body">
              {t("We believe the best journeys feel effortless, personal, and full of moments you didn’t plan for. We bring the details together—from the first airport pickup to the local places you’ll remember long after you leave.")}
            </p>
            <div className="story-section__values">
              <div><span>01</span><p><strong>{t("Thoughtful by nature")}</strong><small>{t("Details considered before you arrive.")}</small></p></div>
              <div><span>02</span><p><strong>{t("Rooted in Morocco")}</strong><small>{t("Local knowledge, genuine connections.")}</small></p></div>
              <div><span>03</span><p><strong>{t("Always your journey")}</strong><small>{t("Made to move at your own pace.")}</small></p></div>
            </div>
            <Link href="#contact" className="story-section__link">
              {t("Let’s plan your journey")} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div className="story-section__footer">
          <span>{t("FROM THE FIRST HELLO")}</span>
          <span aria-hidden="true" className="story-section__footer-line" />
          <span>{t("TO THE STORIES YOU TAKE HOME")}</span>
        </div>
      </div>
    </section>
  );
}
