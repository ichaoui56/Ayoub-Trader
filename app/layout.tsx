import type { Metadata, Viewport } from "next";
import "../src/index.css";
import { LocaleProvider } from "../src/components/LocaleProvider";
import BrokerSignupButton from "../src/components/BrokerSignupButton";
import { getBrokerReferralUrl } from "../src/lib/utils/broker-referral";

export const metadata: Metadata = {
  title: { default: "Ayoub Trader | Trading education and services", template: "%s | Ayoub Trader" },
  description: "Trading education, private community access, copy trading applications, and recurring one-to-one coaching from Ayoub Trader.",
  applicationName: "Ayoub Trader",
  openGraph: {
    type: "website",
    siteName: "Ayoub Trader",
    title: "Ayoub Trader | Trading education and services",
    description: "Trading education, private community access, copy trading applications, and recurring coaching.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07120b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider initialLocale="en">
          {children}
          <BrokerSignupButton href={getBrokerReferralUrl()} />
        </LocaleProvider>
      </body>
    </html>
  );
}
