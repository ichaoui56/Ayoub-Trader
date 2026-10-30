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
import type { Activity } from "./activities";
import type { BlogPost } from "./blogs";
import type { Locale } from "./i18n";

export default function App({ activities, posts, locale }: { activities: Activity[]; posts: BlogPost[]; locale: Locale }) {
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
        <ScrollFilm locale={locale} />
        <ScrollMotion>
          <AirportTransferWrapper locale={locale} />
          <Stays locale={locale} />
          <Experiences activities={activities} locale={locale} />
          <Concierge locale={locale} />
          <JourneySteps locale={locale} />
          <BlogSection locale={locale} posts={posts} />
          <WhyChooseUs locale={locale} />
          <FinalCallToAction locale={locale} />
        </ScrollMotion>
      </main>
    </>
  );
}
