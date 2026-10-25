import Link from "next/link";
import Nav from "./components/Nav";
import ScrollFilm from "./components/ScrollFilm";
import ScrollMotion from "./components/ScrollMotion";
import AirportTransfer from "./components/AirportTransfer";
import Stays from "./components/Stays";
import Experiences from "./components/Experiences";
import Concierge from "./components/Concierge";
import JourneySteps from "./components/JourneySteps";
import Destinations from "./components/Destinations";
import WhyChooseUs from "./components/WhyChooseUs";
import FinalCallToAction from "./components/FinalCallToAction";
import PageLoader from "./components/PageLoader";

export default function App() {
  return (
    <>
      <PageLoader />
      <Link
        href="#transfer"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to the content
      </Link>
      <Nav />
      <main>
        <ScrollFilm />
        <ScrollMotion>
          <AirportTransfer />
          <Stays />
          <Experiences />
          <Concierge />
          <JourneySteps />
          <Destinations />
          <WhyChooseUs />
          <FinalCallToAction />
        </ScrollMotion>
      </main>
    </>
  );
}
