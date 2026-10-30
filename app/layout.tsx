import type { Metadata, Viewport } from "next";
import { getLocale } from "../src/server/locale";
import "../src/index.css";
import { ActivityReservationProvider } from "../src/components/ActivityReservations";
import { LocaleProvider } from "../src/components/LocaleProvider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const french = locale === "fr";
  return {
    title: french ? "Morocco Journeys — Chaque arrivée, pensée avec soin." : "Morocco Journeys — Every arrival, considered.",
    description: french
      ? "Une conciergerie marocaine attentive pour vos transferts aéroport, hébergements choisis et expériences locales inoubliables."
      : "A thoughtful Morocco concierge for seamless airport transfers, handpicked stays and unforgettable local experiences.",
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
  return (
    <html lang={locale}>
      <head>
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
