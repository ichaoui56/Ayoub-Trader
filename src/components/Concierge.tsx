import Link from "next/link";
import type { ConciergeSectionSettings } from "../concierge";
import type { Locale } from "../i18n";

export default function Concierge({ locale, settings }: { locale: Locale; settings: ConciergeSectionSettings }) {
  if (!settings.enabled) return null;
  const text = (value: Record<Locale, string>) => value[locale];
  return (
    <section id={settings.sectionId} className="story-section">
      <div className="story-section__inner">
        <div className="story-section__topline">
          <p className="eyebrow">{text(settings.eyebrow)}</p>
          <span aria-hidden="true">{text(settings.establishment)}</span>
        </div>

        <div className="story-section__layout">
          <div className="story-section__visual" data-reveal>
            <figure className="story-section__image">
              <img
                src={settings.image}
                alt={text(settings.imageAlt)}
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <span>{text(settings.imageOverline)}</span>
                <strong>{text(settings.imageCaption)}</strong>
              </figcaption>
            </figure>
            <div className="story-section__seal" aria-hidden="true">
              {settings.seal.map((label, index) => <span key={index}>{text(label)}</span>)}
            </div>
            <div className="story-section__image-index"><span>{settings.imageIndexNumber}</span> / {text(settings.imageIndex)}</div>
          </div>

          <div className="story-section__copy" data-reveal>
            <p className="story-section__kicker"><span /> {text(settings.kicker)}</p>
            <h2>
              {text(settings.headingOne)}<br />
              {text(settings.headingTwo)}<br />
              {text(settings.headingThree)} <span>{text(settings.headingAccent)}</span>
            </h2>
            <p className="story-section__body">
              {text(settings.body)}
            </p>
            <div className="story-section__values">
              {settings.values.map((value, index) => (
                <div key={`${index}-${text(value.title)}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p><strong>{text(value.title)}</strong><small>{text(value.description)}</small></p>
                </div>
              ))}
            </div>
            <Link href={settings.ctaHref} className="story-section__link">
              {text(settings.ctaLabel)} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div className="story-section__footer">
          <span>{text(settings.footerStart)}</span>
          <span aria-hidden="true" className="story-section__footer-line" />
          <span>{text(settings.footerEnd)}</span>
        </div>
      </div>
    </section>
  );
}
