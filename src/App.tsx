import Link from "next/link";
import Nav from "./components/Nav";
import ScrollFilm from "./components/ScrollFilm";
import ScrollMotion from "./components/ScrollMotion";
import AirportTransferWrapper from "./components/AirportTransferWrapper";
import Stays from "./components/Stays";
import Experiences from "./components/Experiences";
import Concierge from "./components/Concierge";
import JourneySteps from "./components/JourneySteps";
import BlogSection from "./components/BlogSection";
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
          <AirportTransferWrapper />
          <Stays />
          <Experiences />
          <Concierge />
          <JourneySteps />
          <BlogSection />
          <WhyChooseUs />
          <FinalCallToAction />
        </ScrollMotion>
      </main>
    </>
  );
}
