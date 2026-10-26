export type ActivityImage = {
  src: string;
  alt: string;
};

export type ActivityBookingRate = {
  id: string;
  label: string;
  price: number;
  unit: string;
  billing: "person" | "unit";
  peoplePerUnit?: number;
  description?: string;
};

export type ActivityBookingExtra = {
  id: string;
  label: string;
  price: number;
  unit: string;
  billing: "person" | "unit";
};

export type Activity = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  image: string;
  imageAlt: string;
  location: string;
  duration?: string;
  pace: string;
  overview: string;
  highlights: string[];
  itinerary: { title: string; description: string }[];
  goodToKnow: string[];
  popular: boolean;
  gallery?: ActivityImage[];
  priceOptions?: { label: string; price: string; unit?: string }[];
  pickup?: string;
  bookingUrl?: string;
  included?: string[];
  paymentNote?: string;
  rating?: { label: string; url: string };
  privateOption?: { title: string; description: string; price: string; url: string };
  faqs?: { question: string; answer: string }[];
  reservation?: {
    times?: string[];
    rates: ActivityBookingRate[];
    childRate?: { price: number; label: string };
    extras?: ActivityBookingExtra[];
    extraSelectionMode?: "single" | "multiple";
    priceNeedsConfirmation?: boolean;
  };
};

export const activities: Activity[] = [
  {
    slug: "quad-biking",
    title: "Quad",
    category: "Adventure",
    summary: "Ride forest tracks, dunes, and the Atlantic coast, with sandboarding and a Moroccan tea break along the way.",
    image: "https://www.bookagadirexperience.com/images/quad/quad-riders-cheering.jpg",
    imageAlt: "Quad riders celebrating on a beach beside the Atlantic near Agadir",
    location: "Agadir and Taghazout",
    duration: "2 hours",
    pace: "Active",
    overview:
      "Choose a solo quad or share one with a passenger, then follow your guide across forest tracks, dunes, and the Atlantic coast. The experience includes a safety briefing, sandboarding, a tea break, and photo stops.",
    highlights: [
      "Forest tracks, dunes, and the Atlantic coast",
      "Sandboarding, Moroccan tea, and photo stops included",
      "Pickup from accommodation in Agadir or Taghazout",
    ],
    itinerary: [
      { title: "Pickup and briefing", description: "Meet your guide, get equipped, and go over the route and safety guidance." },
      { title: "Ride the trails", description: "Enjoy two hours of guided quad riding across tracks, dunes, and the coast." },
      { title: "Sandboard and take a break", description: "Stop for sandboarding, Moroccan tea, photos, and the return ride." },
    ],
    goodToKnow: ["Departures are listed at 09:00 and 14:00; confirm your preferred time when booking.", "Wear closed shoes and clothes you don't mind getting dusty; bring sunglasses and sun protection.", "The operator advises against riding during pregnancy or with back problems."],
    popular: true,
    gallery: [
      { src: "https://www.bookagadirexperience.com/images/quad/quad-riders-cheering.jpg", alt: "Quad riders celebrating beside the Atlantic coast" },
      { src: "https://www.bookagadirexperience.com/images/quad/quad-sunset-riders.jpg", alt: "Quad riders on the beach at sunset near Agadir" },
      { src: "https://www.bookagadirexperience.com/images/experiences/moroccan-tea.jpg", alt: "Moroccan mint tea served during a desert break" },
      { src: "https://www.bookagadirexperience.com/images/quad/quad-rider-photo.jpg", alt: "A helmeted rider taking a photo from a quad on a sandy track" },
      { src: "https://www.bookagadirexperience.com/images/quad/quad-dunes-convoy.jpg", alt: "A convoy of quads crossing the dunes" },
      { src: "https://www.bookagadirexperience.com/images/quad/quad-departure.jpg", alt: "Guests preparing their quads with a guide before departure" },
    ],
    priceOptions: [
      { label: "Solo quad", price: "36 €", unit: "per quad" },
      { label: "Shared quad", price: "18 €", unit: "per person" },
    ],
    pickup: "Included from your accommodation in Agadir or Taghazout",
    bookingUrl: "https://www.bookagadirexperience.com/fr/quad-agadir",
    reservation: {
      times: ["09h00", "14h00"],
      rates: [
        { id: "solo", label: "Quad solo", price: 36, unit: "per quad", billing: "unit", peoplePerUnit: 1, description: "1 pilot per quad" },
        { id: "shared", label: "Quad partagé", price: 18, unit: "per person", billing: "person", peoplePerUnit: 2, description: "Up to 2 people per quad" },
      ],
      extras: [
        { id: "photo", label: "Photo pack", price: 25, unit: "per quad", billing: "unit" },
        { id: "tea", label: "Tea break pack", price: 30, unit: "per quad", billing: "unit" },
        { id: "sandboard", label: "Sandboarding pack", price: 30, unit: "per quad", billing: "unit" },
        { id: "sandboard-tea", label: "Sandboarding + tea", price: 35, unit: "per quad", billing: "unit" },
        { id: "complete", label: "Complete pack", price: 40, unit: "per quad", billing: "unit" },
      ],
      extraSelectionMode: "single",
    },
    included: ["Quad (solo or shared)", "Guide, helmet, fuel, and safety briefing", "Sandboarding and Moroccan tea", "Pickup and return in Agadir or Taghazout"],
    paymentNote: "No online payment. Pay on the day of the activity after your booking is confirmed.",
  },
  {
    slug: "jet-skiing",
    title: "Jet ski",
    category: "Water",
    summary: "Enjoy a 30-minute jet ski session on the Atlantic, with pickup from your accommodation included.",
    image: "https://www.bookagadirexperience.com/images/jetski/jet-ski-rider-blue.jpg",
    imageAlt: "A rider on a blue and white jet ski on the water",
    location: "Agadir Bay",
    duration: "30 minutes",
    pace: "High energy",
    overview:
      "See Agadir's shoreline from the water on a 30-minute jet ski session. The operator provides pickup and confirms the schedule before the activity.",
    highlights: [
      "30 minutes on the Atlantic",
      "Up to two people per jet ski",
      "Pickup and return included",
    ],
    itinerary: [
      { title: "Confirm your session", description: "The team confirms your time and pickup details before the activity." },
      { title: "Get ready", description: "Meet the watersports team and follow their instructions before heading out." },
      { title: "Ride the bay", description: "Enjoy your 30-minute session and return to shore at the agreed time." },
    ],
    goodToKnow: ["One jet ski accommodates up to two people.", "The operator confirms the schedule before booking; sea conditions may affect availability."],
    popular: true,
    gallery: [{ src: "https://www.bookagadirexperience.com/images/jetski/jet-ski-rider-blue.jpg", alt: "A rider on a blue and white jet ski on the water" }],
    priceOptions: [{ label: "Jet ski", price: "80 €", unit: "per jet ski" }],
    pickup: "Included",
    bookingUrl: "https://www.bookagadirexperience.com/fr/jet-ski-agadir",
    reservation: {
      rates: [{ id: "jetski", label: "Jet ski", price: 80, unit: "per jet ski", billing: "unit", peoplePerUnit: 2, description: "Up to 2 people per jet ski" }],
    },
    included: ["30-minute jet ski session", "Pickup and return"],
    paymentNote: "No online payment. Pay on the day of the activity after your booking is confirmed.",
  },
  {
    slug: "surfing",
    title: "Private surf lesson in Tamraght",
    category: "Ocean",
    summary: "A private two-hour surf lesson adapted to your level, with surf equipment included.",
    image: "https://www.bookagadirexperience.com/images/partners/cours-surf-agadir-echauffement-plage.jpg",
    imageAlt: "Surfers warming up on the beach before a lesson near Agadir",
    location: "Tamraght",
    duration: "2 hours",
    pace: "Active",
    overview:
      "Learn with a private instructor in Tamraght, the surf village between Agadir and Taghazout. Your instructor adapts the session to your level, from first steps to improving your technique.",
    highlights: [
      "Private lesson adapted to your level",
      "Two hours on the beach and in the water",
      "Surf equipment and personal coaching included",
    ],
    itinerary: [
      { title: "Meet your instructor", description: "Talk through your experience and set a focus for the lesson." },
      { title: "Prepare on the beach", description: "Get your equipment and review the conditions and safety guidance." },
      { title: "Practice and review", description: "Surf with individual coaching, then take away tips to keep progressing." },
    ],
    goodToKnow: ["Daily sessions are listed at 08:30, 10:30, 12:30, and 14:30; confirm your choice when booking.", "The two-hour lesson does not include travel time.", "Pickup can be discussed with the team; drinks are not included."],
    popular: true,
    gallery: [{ src: "https://www.bookagadirexperience.com/images/partners/cours-surf-agadir-echauffement-plage.jpg", alt: "Surfers warming up on the beach before a lesson near Agadir" }],
    priceOptions: [{ label: "Private lesson", price: "40 €", unit: "per person" }],
    pickup: "By request; confirm your address with the operator",
    bookingUrl: "https://www.bookagadirexperience.com/fr/cours-de-surf-tamraght",
    reservation: {
      times: ["08h30", "10h30", "12h30", "14h30"],
      rates: [{ id: "private-lesson", label: "Private surf lesson", price: 40, unit: "per person", billing: "person" }],
    },
    included: ["Private two-hour surf lesson", "Surf equipment", "Personal coaching"],
    paymentNote: "No online payment. Pay on the day of the activity after your booking is confirmed.",
  },
  {
    slug: "buggy-ride",
    title: "Off-road buggy ride",
    category: "Adventure",
    summary: "Drive a two-seat buggy across sandy tracks and dunes around Agadir.",
    image: "https://www.bookagadirexperience.com/images/temp/buggy-sahara-drift.jpg",
    imageAlt: "An off-road buggy drifting across orange desert sand",
    location: "Agadir",
    pace: "Active",
    overview:
      "Take the wheel of an off-road buggy and explore sandy tracks and dunes around Agadir. Each buggy accommodates up to two people, and pickup from your accommodation is included.",
    highlights: [
      "Off-road driving across sand and tracks",
      "Up to two people per buggy",
      "Pickup and return included",
    ],
    itinerary: [
      { title: "Confirm your pickup", description: "Share your accommodation and the operator will confirm the schedule." },
      { title: "Get ready to ride", description: "Meet the team and follow their instructions before setting off." },
      { title: "Explore the tracks", description: "Ride through sandy terrain and return to your accommodation." },
    ],
    goodToKnow: ["Choose the number of buggies based on your group; each buggy seats up to two people.", "The operator confirms the activity time before booking."],
    popular: true,
    gallery: [{ src: "https://www.bookagadirexperience.com/images/temp/buggy-sahara-drift.jpg", alt: "An off-road buggy drifting across orange desert sand" }],
    priceOptions: [{ label: "Buggy", price: "90 €", unit: "per buggy, up to 2 people" }],
    pickup: "Included",
    bookingUrl: "https://www.bookagadirexperience.com/fr/buggy-agadir",
    reservation: {
      rates: [{ id: "buggy", label: "Buggy", price: 90, unit: "per buggy", billing: "unit", peoplePerUnit: 2, description: "Up to 2 people per buggy" }],
    },
    included: ["Buggy ride", "Pickup and return"],
    paymentNote: "No online payment. Pay on the day of the activity after your booking is confirmed.",
    faqs: [
      { question: "How much does a buggy ride cost?", answer: "The price is 90 € per buggy, with up to two people in each buggy." },
      { question: "Is pickup included?", answer: "Yes. Share your hotel or address when booking." },
      { question: "When does the ride start?", answer: "The operator confirms the schedule before booking." },
    ],
  },
  {
    slug: "mini-sahara-massa",
    title: "Mini Sahara and Massa excursion",
    category: "Nature",
    summary: "A shared full-day trip to the Mini Sahara dunes, Souss-Massa, and the Massa estuary.",
    image: "https://www.bookagadirexperience.com/images/partners/excursion-desert-dunes-agadir.jpg",
    imageAlt: "Travellers sitting at the top of an orange sand dune",
    location: "Souss-Massa, south of Agadir",
    duration: "8 hours",
    pace: "Easy",
    overview:
      "Spend a day south of Agadir with a shared group excursion to the Mini Sahara dunes, Souss-Massa National Park, and the Massa estuary. The trip includes hotel pickup, air-conditioned transport, a local guide, and a traditional Berber lunch.",
    highlights: [
      "Walk among the Mini Sahara dunes",
      "Visit Souss-Massa National Park and the Massa estuary",
      "Enjoy a Berber lunch in a family home",
      "Pickup from your Agadir hotel included",
    ],
    itinerary: [
      { title: "Pickup in Agadir", description: "Meet your guide at your hotel and travel south in an air-conditioned vehicle." },
      { title: "Explore the Mini Sahara", description: "Walk on the dunes; a short camel ride may be available at extra cost." },
      { title: "Discover Massa", description: "Visit the national park and estuary, then share a traditional lunch before returning to Agadir." },
    ],
    goodToKnow: ["Children aged 3–12 have a reduced rate; children under 3 travel free.", "A camel ride on the dunes is optional and not included.", "Bring water, sun protection, and comfortable shoes for walking on sand."],
    popular: true,
    gallery: [{ src: "https://www.bookagadirexperience.com/images/partners/excursion-desert-dunes-agadir.jpg", alt: "Travellers sitting at the top of an orange sand dune" }],
    priceOptions: [
      { label: "Adults", price: "45 €", unit: "per person" },
      { label: "Children aged 3–12", price: "23 €", unit: "per child" },
    ],
    pickup: "Included from your hotel in Agadir",
    bookingUrl: "https://www.bookagadirexperience.com/fr/excursion-mini-sahara-agadir",
    reservation: {
      rates: [{ id: "shared-excursion", label: "Shared excursion", price: 45, unit: "per adult", billing: "person" }],
      childRate: { price: 23, label: "Children aged 3–12" },
    },
    included: ["Hotel pickup and return in Agadir", "Air-conditioned transport", "Local guide", "Traditional Berber lunch"],
    paymentNote: "No online payment. Pay on the day of the activity after your booking is confirmed.",
    faqs: [
      { question: "How much does the Mini Sahara excursion cost?", answer: "Adults pay 45 € per person and children aged 3–12 pay 23 € per person. Children under 3 travel free." },
      { question: "Is the excursion suitable for children?", answer: "Yes. The child rate applies from age 3 to 12; children under 3 travel free." },
      { question: "Is a camel ride included?", answer: "No. A short camel ride on the dunes may be available as an optional extra." },
    ],
  },
  {
    slug: "camel-ride",
    title: "Camel ride",
    category: "Culture",
    summary: "Slow down for a guided ride through the coastal landscape.",
    image: "photo-1464822759023-fed622ff2c3b",
    imageAlt: "Mountain landscape beneath a warm evening sky",
    location: "Agadir and nearby coastal areas",
    duration: "About 1–2 hours",
    pace: "Relaxed",
    overview:
      "Take a gentler route through the landscape on a guided camel ride. The experience is an easy way to enjoy the open air, learn about the animals, and take in the changing light along the coast.",
    highlights: [
      "Enjoy a relaxed pace and open-air scenery",
      "Learn how to approach and ride with your guide",
      "Choose a daytime or sunset departure when available",
    ],
    itinerary: [
      { title: "Meet the camel handler", description: "Get introduced to the animals and hear the basic riding guidance." },
      { title: "Set off together", description: "Follow the guide along a route selected for the conditions and group." },
      { title: "Return at an easy pace", description: "Finish the loop with time for a final look at the surrounding landscape." },
    ],
    goodToKnow: ["Wear comfortable clothes and closed shoes.", "Sunset rides and exact routes depend on availability and season.", "Tell the operator in advance about mobility needs or young children."],
    popular: false,
    priceOptions: [{ label: "Camel ride", price: "20 €", unit: "per person" }],
    reservation: {
      rates: [{ id: "camel-ride", label: "Camel ride", price: 20, unit: "per person", billing: "person" }],
    },
  },
  {
    slug: "boat-trip",
    title: "Boat trip",
    category: "Ocean",
    summary: "Spend a few unhurried hours on the water from Agadir Marina.",
    image: "photo-1501785888041-af3ef285b470",
    imageAlt: "Blue water framed by a rugged coastline",
    location: "Agadir Marina",
    duration: "About 3–4 hours",
    pace: "Relaxed",
    overview:
      "Step away from the shore for a boat outing along the Atlantic coast. Depending on the trip selected, there may be time to enjoy the sea, take in the coastline, or pause for a swim when conditions allow.",
    highlights: [
      "See the coast from the water",
      "Enjoy a slower change of pace from the city",
      "Ask about swim stops when sea conditions permit",
    ],
    itinerary: [
      { title: "Board at the marina", description: "Meet the crew and get settled before departure." },
      { title: "Cruise the coastline", description: "Enjoy the views and the time on the water at an easy pace." },
      { title: "Return to port", description: "Head back to the marina according to the trip schedule and conditions." },
    ],
    goodToKnow: ["Bring a light layer, sun protection, and any personal medication.", "The route and stops depend on weather and sea conditions.", "Confirm what is included with the operator before booking."],
    popular: false,
    priceOptions: [{ label: "Boat trip", price: "50 €", unit: "per person" }],
    reservation: {
      rates: [{ id: "boat-trip", label: "Boat trip", price: 50, unit: "per person", billing: "person" }],
    },
  },
  {
    slug: "agadir-city-tour",
    title: "Guided Agadir city tour",
    category: "Culture",
    summary: "Get to know Agadir through its landmarks, viewpoints, and local life.",
    image: "photo-1512453979798-5ea266f8880c",
    imageAlt: "A lively North African city street at dusk",
    location: "Agadir",
    duration: "About half a day",
    pace: "Easy",
    overview:
      "Get your bearings with a guided introduction to Agadir. A city tour can connect the kasbah viewpoint, central landmarks, and local neighbourhoods, with the exact route shaped around your interests.",
    highlights: [
      "Take in wide views from above the city",
      "Learn about Agadir's past and its modern character",
      "Ask your guide for local recommendations along the way",
    ],
    itinerary: [
      { title: "Start with the view", description: "Take in the bay and city from a viewpoint above Agadir." },
      { title: "Explore the city", description: "Visit selected landmarks and hear how the city has changed over time." },
      { title: "Finish locally", description: "Spend time at a market or neighbourhood stop if included in your chosen route." },
    ],
    goodToKnow: ["Wear comfortable shoes and bring water.", "Market visits and stops depend on opening hours and the itinerary.", "Confirm pickup, language, and entry costs with the tour provider."],
    popular: false,
    priceOptions: [{ label: "Shared tour", price: "20 €", unit: "per person" }],
    reservation: {
      rates: [{ id: "shared-tour", label: "Shared city tour", price: 20, unit: "per person", billing: "person" }],
    },
  },
  {
    slug: "paradise-valley",
    title: "Paradise Valley from Agadir",
    category: "Nature",
    summary: "Join a shared trip to a palm-filled valley and natural pools in the hills northeast of Agadir, with pickup included.",
    image: "https://www.bookagadirexperience.com/images/paradise-valley/paradise-valley-turquoise.jpg",
    imageAlt: "A turquoise natural pool among the palms of Paradise Valley",
    location: "Agadir region",
    pace: "Easy",
    overview:
      "Travel as part of a shared group to Paradise Valley, a palm-lined landscape of natural pools in the hills northeast of Agadir. Pickup is included; the team confirms the departure time before the trip.",
    highlights: [
      "Palm trees and natural pools",
      "Shared group excursion",
      "Pickup and return included",
    ],
    itinerary: [
      { title: "Pickup and departure", description: "The team confirms your departure time and collects you from your accommodation." },
      { title: "Explore the valley", description: "Enjoy the palms and natural pools with the shared group." },
      { title: "Return to Agadir", description: "Travel back after your visit; the operator confirms the schedule in advance." },
    ],
    goodToKnow: ["The operator confirms the departure time before the trip.", "No online payment; pay on the day after your booking is confirmed."],
    popular: true,
    gallery: [
      { src: "https://www.bookagadirexperience.com/images/paradise-valley/paradise-valley-turquoise.jpg", alt: "A turquoise natural pool among the palms of Paradise Valley" },
      { src: "https://www.bookagadirexperience.com/images/paradise-valley/paradise-valley-swimming-pool.jpg", alt: "Visitors swimming in a natural turquoise pool between rocks and palms" },
      { src: "https://www.bookagadirexperience.com/images/temp/paradise-valley-pool.jpg", alt: "A natural pool surrounded by palm trees in Paradise Valley" },
    ],
    priceOptions: [{ label: "Shared excursion", price: "20 €", unit: "per person" }],
    pickup: "Included; pickup and return",
    bookingUrl: "https://www.bookagadirexperience.com/fr/vallee-du-paradis-agadir",
    reservation: {
      rates: [{ id: "shared-excursion", label: "Shared excursion", price: 20, unit: "per person", billing: "person" }],
    },
    included: ["Shared excursion to Paradise Valley", "Pickup and return"],
    paymentNote: "No online payment. Pay on the day of the activity after your booking is confirmed.",
    rating: {
      label: "5.0 on Google",
      url: "https://maps.google.com/?cid=6267543863564659320",
    },
    privateOption: {
      title: "Private vehicle to Paradise Valley",
      description: "Up to 8 people · half-day",
      price: "75 €",
      url: "https://www.bookagadirexperience.com/fr/transfert-aeroport-agadir#paradise-valley-private",
    },
    faqs: [
      { question: "How much does the Paradise Valley excursion cost?", answer: "The shared excursion costs 20 € per person, with pickup included." },
      { question: "Can we go privately?", answer: "Yes. A private vehicle costs 75 € for up to 8 people for a half-day." },
      { question: "How does payment work?", answer: "There is no online payment. The team confirms your request, and payment is made on the day of the activity after confirmation." },
    ],
  },
  {
    slug: "sandboarding",
    title: "Sandboarding at Timlalin",
    category: "Adventure",
    summary: "Take on the dunes above the Atlantic on a guided sandboarding outing.",
    image: "photo-1473580044384-7ba9967e16a0",
    imageAlt: "Golden sand dunes under a clear sky",
    location: "Timlalin dunes, north of Agadir",
    duration: "About 3–4 hours",
    pace: "Active",
    overview:
      "Climb the soft slopes, take in the views over the coast, and try sandboarding with a local guide. The outing combines time outdoors with an introduction to the dunes and the surrounding landscape.",
    highlights: [
      "Try a new activity on the open dunes",
      "Enjoy views across the Atlantic coastline",
      "Go at your own pace with guidance on the sand",
    ],
    itinerary: [
      { title: "Reach the dunes", description: "Travel to the sand hills and get oriented with your guide." },
      { title: "Learn the basics", description: "Get familiar with the board and how to move safely on the slope." },
      { title: "Ride and explore", description: "Try a few runs and enjoy time to take in the scenery." },
    ],
    goodToKnow: ["Wear closed shoes and bring sun protection.", "Sand and wind conditions can change the best time and exact location.", "Confirm transport and equipment details with the operator."],
    popular: false,
    priceOptions: [{ label: "Sandboarding", price: "30 €", unit: "per person" }],
    reservation: {
      rates: [{ id: "sandboarding", label: "Sandboarding", price: 30, unit: "per person", billing: "person" }],
    },
  },
  {
    slug: "moroccan-cooking-class",
    title: "Moroccan cooking class",
    category: "Food",
    summary: "Discover local ingredients and learn the rhythm of a Moroccan kitchen.",
    image: "photo-1547592180-85f173990554",
    imageAlt: "A colourful table of freshly prepared food",
    location: "Agadir and Taghazout",
    duration: "About 3–4 hours",
    pace: "Easy",
    overview:
      "Spend time around the kitchen table learning about the ingredients and techniques behind Moroccan home cooking. Depending on the host, the session may include shopping, preparation, and sharing the meal together.",
    highlights: [
      "Get hands-on with a local recipe",
      "Learn about spices and seasonal ingredients",
      "Share the food you've helped prepare",
    ],
    itinerary: [
      { title: "Meet your host", description: "Get introduced to the menu and the ingredients for the session." },
      { title: "Cook together", description: "Prepare a selection of dishes with guidance from your host." },
      { title: "Sit down to eat", description: "Enjoy the meal and exchange stories around the table." },
    ],
    goodToKnow: ["Mention dietary needs and allergies before confirming.", "Menus and market visits depend on the host and season.", "Ask what food and drinks are included in the session."],
    popular: false,
    priceOptions: [
      { label: "Adults", price: "45 €", unit: "per person" },
      { label: "Children aged 3–12", price: "15 €", unit: "per child" },
    ],
    reservation: {
      rates: [{ id: "adult", label: "Adults", price: 45, unit: "per person", billing: "person" }],
      childRate: { price: 15, label: "Children aged 3–12" },
    },
  },
  {
    slug: "traditional-hammam",
    title: "Traditional hammam",
    category: "Wellbeing",
    summary: "Make time to slow down with a traditional Moroccan bathing ritual.",
    image: "photo-1540555700478-4be289fbecef",
    imageAlt: "A calm spa interior prepared for a wellness treatment",
    location: "Agadir",
    duration: "About 1–2 hours",
    pace: "Relaxed",
    overview:
      "Step into a local bathing tradition built around warmth, cleansing, and time to unwind. Hammam experiences vary by venue, so choose the level of service that suits you and check what is included before your visit.",
    highlights: [
      "Experience a familiar part of Moroccan wellbeing culture",
      "Choose a traditional or spa-style setting",
      "Build a slower moment into your itinerary",
    ],
    itinerary: [
      { title: "Choose your experience", description: "Confirm the venue, treatment, and any services you would like." },
      { title: "Enjoy the hammam", description: "Follow the venue's guidance through the bathing ritual." },
      { title: "Take time to relax", description: "Allow a little extra time after your session before heading out." },
    ],
    goodToKnow: ["Ask the venue about towels, products, and what to bring.", "Treatments, privacy options, and etiquette vary by hammam.", "Share any health considerations with the venue in advance."],
    popular: false,
  },
  {
    slug: "essaouira-day-trip",
    title: "Essaouira",
    category: "Culture",
    summary: "A shared excursion to Essaouira, with the schedule and pickup details confirmed by the activity team.",
    image: "photo-1500375592092-40eb2168fd21",
    imageAlt: "Atlantic waves rolling onto the Moroccan coast",
    location: "Essaouira",
    pace: "Relaxed",
    overview:
      "Discover Essaouira on a shared excursion. The activity team confirms the departure schedule and pickup details when you send your request.",
    highlights: ["Shared excursion", "Adult and child rates available", "Schedule confirmed by the activity team"],
    itinerary: [
      { title: "Confirm your request", description: "Share your date, group size, and pickup details with the activity team." },
      { title: "Travel to Essaouira", description: "The team confirms the route and schedule before your excursion." },
      { title: "Enjoy your visit", description: "Follow the confirmed plan for your shared excursion." },
    ],
    goodToKnow: ["Departure times and pickup details are confirmed by the activity team.", "No online payment is taken through this website."],
    popular: false,
    priceOptions: [
      { label: "Adults", price: "35 €", unit: "per person" },
      { label: "Children aged 3–12", price: "18 €", unit: "per child" },
    ],
    reservation: {
      rates: [{ id: "adult", label: "Adults", price: 35, unit: "per person", billing: "person" }],
      childRate: { price: 18, label: "Children aged 3–12" },
    },
  },
  {
    slug: "hot-air-balloon",
    title: "Hot-air balloon",
    category: "Adventure",
    summary: "Request a shared hot-air balloon flight; the activity team confirms availability and the final price.",
    image: "photo-1504198453319-5ce911bafcde",
    imageAlt: "Hot-air balloon floating over a wide landscape at sunrise",
    location: "Agadir region",
    pace: "Relaxed",
    overview:
      "Request a place on a shared hot-air balloon flight. The listed price is indicative; the activity team confirms availability and the final price before your booking is confirmed.",
    highlights: ["Shared flight", "Indicative price of 205 € per person", "Final price confirmed by the activity team"],
    itinerary: [
      { title: "Send your request", description: "Choose your preferred date and group size." },
      { title: "Wait for confirmation", description: "The activity team confirms availability, schedule, and final price." },
      { title: "Enjoy your flight", description: "Your flight details are shared after confirmation." },
    ],
    goodToKnow: ["Availability and final price must be confirmed by the activity team.", "No online payment is taken through this website."],
    popular: false,
    priceOptions: [{ label: "Shared flight", price: "205 €", unit: "indicative price per person" }],
    reservation: {
      rates: [{ id: "shared-flight", label: "Shared flight", price: 205, unit: "per person", billing: "person" }],
      priceNeedsConfirmation: true,
    },
  },
];

export const getActivityImageUrl = (image: string, width = 1000) =>
  image.startsWith("https://")
    ? image
    : `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=85`;

export const getActivityBySlug = (slug: string) =>
  activities.find((activity) => activity.slug === slug);

export const getFeaturedActivities = () => {
  const featuredSlugs = ["quad-biking", "buggy-ride", "jet-skiing", "mini-sahara-massa", "paradise-valley", "surfing"];

  return featuredSlugs
    .map((slug) => getActivityBySlug(slug))
    .filter((activity): activity is Activity => activity !== undefined);
};
