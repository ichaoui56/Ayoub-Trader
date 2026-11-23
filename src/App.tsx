"use client";

import PageLoader from "./components/PageLoader";
import Nav from "./components/Nav";
import ScrollFilm from "./components/ScrollFilm";
import TradingServicesSection from "./components/TradingServicesSection";
import OpenAccountSection from "./components/OpenAccountSection";
import { getBrokerReferralUrl } from "./lib/utils/broker-referral";
import { useLocale } from "./components/LocaleProvider";
import {
  TradingCoachingSection,
  TradingHomeFooter,
} from "./components/TradingHomeSections";

export default function App() {
  const { locale } = useLocale();
  return (
    <>
      <PageLoader />
      <Nav />
      <main className="min-h-screen bg-paper text-ink">
        <ScrollFilm locale={locale} />
        <OpenAccountSection signupHref={getBrokerReferralUrl()} />
        <TradingServicesSection />
        <TradingCoachingSection />
      </main>
      <TradingHomeFooter />
    </>
  );
}
