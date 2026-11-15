import PageLoader from "./components/PageLoader";
import Nav from "./components/Nav";
import ScrollFilm from "./components/ScrollFilm";
import OpenAccountSection from "./components/OpenAccountSection";
import TradingServicesSection from "./components/TradingServicesSection";
import {
  TradingCoachingSection,
  TradingHomeFooter,
} from "./components/TradingHomeSections";
import { getBrokerReferralUrl } from "./lib/utils/broker-referral";

export default function App() {
  return (
    <>
      <PageLoader />
      <Nav />
      <main className="min-h-screen bg-paper text-ink">
        <ScrollFilm locale="en" />
        <OpenAccountSection signupHref={getBrokerReferralUrl()} />
        <TradingServicesSection />
        <TradingCoachingSection />
      </main>
      <TradingHomeFooter />
    </>
  );
}
