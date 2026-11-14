import PageLoader from "./components/PageLoader";
import Nav from "./components/Nav";
import ScrollFilm from "./components/ScrollFilm";
import TradingServicesSection from "./components/TradingServicesSection";
import {
  TradingCoachingSection,
  TradingHomeFooter,
} from "./components/TradingHomeSections";

export default function App() {
  return (
    <>
      <PageLoader />
      <Nav />
      <main className="min-h-screen bg-paper text-ink">
        <ScrollFilm locale="en" />
        <TradingServicesSection />
        <TradingCoachingSection />
      </main>
      <TradingHomeFooter />
    </>
  );
}
