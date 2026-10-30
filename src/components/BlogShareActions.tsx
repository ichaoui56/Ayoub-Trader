"use client";

import { useEffect, useState } from "react";
import { translate, type Locale } from "../i18n";

const sharePlatforms = [
  {
    name: "WhatsApp",
    url: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: "Facebook",
    url: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "X",
    url: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "LinkedIn",
    url: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: "Telegram",
    url: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "Email",
    url: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
];

type BlogShareActionsProps = {
  title: string;
  locale: Locale;
};

export default function BlogShareActions({ title, locale }: BlogShareActionsProps) {
  const t = (phrase: string) => translate(locale, phrase);
  const [pageUrl, setPageUrl] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl || window.location.href);
      setMessage(t("Link copied — pass the story along."));
    } catch {
      setMessage(t("Couldn’t copy the link. You can copy it from your address bar."));
    }
  }

  async function useNativeShare() {
    if (!navigator.share) {
      setMessage(t("Choose a platform below to share this story."));
      return;
    }

    try {
      await navigator.share({ title, url: pageUrl || window.location.href });
      setMessage(t("Thanks for sharing this story."));
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setMessage(t("Sharing isn’t available right now. Choose a platform below."));
      }
    }
  }

  return (
    <div className="blog-share">
      <div className="blog-share__intro">
        <span className="blog-share__spark" aria-hidden="true">✳</span>
        <div>
          <p>{t("Good stories travel")}</p>
          <span>{t("Pass this one along")}</span>
        </div>
      </div>
      <div className="blog-share__controls">
        <button type="button" className="blog-share__copy" onClick={copyLink} disabled={!pageUrl}>
          <span aria-hidden="true">⧉</span> {t("Copy link")}
        </button>
        <button
          type="button"
          className="blog-share__toggle"
          aria-expanded={menuOpen}
          aria-controls="blog-share-options"
          onClick={() => {
            setMenuOpen((open) => !open);
            setMessage("");
          }}
        >
          {t("Share story")} <span aria-hidden="true">{menuOpen ? "−" : "↗"}</span>
        </button>
        {menuOpen && (
          <div className="blog-share__menu" id="blog-share-options" aria-label={t("Share this story")}>
            <button type="button" onClick={useNativeShare}>{t("More apps…")}</button>
            {sharePlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url(pageUrl || "", title)}
                target={platform.name === "Email" ? undefined : "_blank"}
                rel={platform.name === "Email" ? undefined : "noopener noreferrer"}
                onClick={(event) => {
                  if (!pageUrl) {
                    event.preventDefault();
                    setMessage(t("Preparing the story link. Try again in a moment."));
                  }
                }}
              >
                {platform.name} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
      <p className="blog-share__message" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
