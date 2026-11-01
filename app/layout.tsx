import type { Metadata, Viewport } from "next";
import { getLocale } from "../src/server/locale";
import "../src/index.css";
import { ActivityReservationProvider } from "../src/components/ActivityReservations";
import { LocaleProvider } from "../src/components/LocaleProvider";
import { getSeoImageUrl } from "../src/seo";
import { getSiteSeoSettings } from "../src/server/site-seo";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, settings] = await Promise.all([getLocale(), getSiteSeoSettings()]);
  const french = locale === "fr";
  const title = french ? settings.titleFr : settings.titleEn;
  const description = french ? settings.descriptionFr : settings.descriptionEn;
  const openGraphTitle = (french ? settings.openGraphTitleFr : settings.openGraphTitleEn) || title;
  const openGraphDescription = (french ? settings.openGraphDescriptionFr : settings.openGraphDescriptionEn) || description;
  const openGraphImage = settings.openGraphImage ? [getSeoImageUrl(settings.openGraphImage)] : undefined;
  return {
    metadataBase: new URL(settings.siteUrl),
    title: { default: title, template: settings.titleTemplate },
    description,
    keywords: (french ? settings.keywordsFr : settings.keywordsEn).split(",").map((keyword) => keyword.trim()).filter(Boolean),
    icons: settings.favicon ? { icon: settings.favicon } : undefined,
    robots: { index: settings.allowIndexing, follow: settings.allowFollowing },
    verification: {
      google: settings.googleVerification || undefined,
      other: settings.bingVerification ? { "msvalidate.01": settings.bingVerification } : undefined,
    },
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      url: settings.siteUrl,
      locale: french ? "fr_FR" : "en_US",
      title: openGraphTitle,
      description: openGraphDescription,
      images: openGraphImage,
    },
    twitter: {
      card: openGraphImage ? "summary_large_image" : "summary",
      site: settings.twitterHandle || undefined,
      creator: settings.twitterHandle || undefined,
      title: openGraphTitle,
      description: openGraphDescription,
      images: openGraphImage,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f4f1e9",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const settings = await getSiteSeoSettings();
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: settings.organizationName,
        url: settings.siteUrl,
        logo: settings.organizationLogo ? getSeoImageUrl(settings.organizationLogo) : undefined,
        sameAs: settings.socialProfiles.length ? settings.socialProfiles : undefined,
      },
      { "@type": "WebSite", name: settings.siteName, url: settings.siteUrl },
    ],
  }).replace(/</g, "\\u003c");
  return (
    <html lang={locale}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider initialLocale={locale}>
          <ActivityReservationProvider>{children}</ActivityReservationProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
