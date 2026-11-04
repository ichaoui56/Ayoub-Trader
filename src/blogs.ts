export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  publishedAt: string;
  readingTime: string;
  location: string;
  introduction: string;
  sections: { heading: string; paragraphs: string[] }[];
  featuredOnHome?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  translations?: Partial<Record<"en" | "fr", Record<string, unknown>>>;
};

export function getBlogTranslation(post: BlogPost): Record<string, unknown> {
  return {
    title: post.title,
    category: post.category,
    excerpt: post.excerpt,
    imageAlt: post.imageAlt,
    readingTime: post.readingTime,
    location: post.location,
    introduction: post.introduction,
    sections: post.sections,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    seoKeywords: post.seoKeywords,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
  };
}

export const blogPosts: BlogPost[] = [
  {
    slug: "a-slower-morning-in-marrakech",
    title: "A slower morning in Marrakech",
    category: "City notes",
    excerpt:
      "Let the medina wake at its own pace. A thoughtful route through quiet streets, warm bread, and the first call to prayer.",
    image: "photo-1539020140153-e479b8c22e70",
    imageAlt: "Warm terracotta rooftops and streets in Marrakech",
    publishedAt: "2026-10-12",
    readingTime: "5 min read",
    location: "Marrakech",
    introduction:
      "Marrakech is at its most generous before the day gets busy. The light is softer, the lanes are still stretching awake, and there is time to notice the small details that make the city feel like itself.",
    sections: [
      {
        heading: "Start where the city starts",
        paragraphs: [
          "Skip the rush to see everything. Begin with a coffee or mint tea near the edge of the medina, then follow the sound of the morning into the smaller streets. Shops open one by one and the familiar rhythm of the city comes into focus.",
          "A local guide can make the first turns feel easy, but leave room to wander. The best discoveries are often the courtyard you nearly walked past or the bakery sending warm khobz into the street.",
        ],
      },
      {
        heading: "Make time for the little things",
        paragraphs: [
          "Look up at carved cedar, pause beside a fountain, and take a seat when a café catches your eye. A slower pace gives the medina space to surprise you, and gives you the energy to enjoy it.",
        ],
      },
      {
        heading: "Let the afternoon unfold",
        paragraphs: [
          "As the day warms, step into a garden or return to your riad for a quiet hour. Marrakech rewards curiosity, but it does not ask you to hurry. A little breathing room can turn a list of sights into a day that feels entirely your own.",
        ],
      },
    ],
  },
  {
    slug: "the-atlantic-road-to-essaouira",
    title: "The Atlantic road to Essaouira",
    category: "On the road",
    excerpt:
      "A coastal drive is more than the distance between two cities. Here’s how to make the journey part of the story.",
    image: "photo-1504215680853-026ed2a45def",
    imageAlt: "Atlantic coastline and the road approaching Essaouira",
    publishedAt: "2026-10-06",
    readingTime: "6 min read",
    location: "Essaouira",
    introduction:
      "The road to Essaouira has a way of easing you into a different tempo. Leave the city behind, follow the Atlantic north, and let the changing landscape set the pace for the days ahead.",
    sections: [
      {
        heading: "Take the scenic route",
        paragraphs: [
          "Plan for a few pauses rather than treating the drive as a transfer to get through. The landscape shifts between open stretches, argan trees, and glimpses of the coast. A comfortable car and an unhurried departure make all the difference.",
          "If you stop at a roadside stand, ask before taking photographs and buy something if you can. Small gestures make a visit feel more like an exchange than a passing glance.",
        ],
      },
      {
        heading: "Arrive with room to explore",
        paragraphs: [
          "Essaouira is made for walking. Its medina is compact, the sea is never far away, and the ramparts give you a clear sense of the city’s history and its relationship with the water.",
        ],
      },
      {
        heading: "Stay for the changing light",
        paragraphs: [
          "Give yourself time to watch the fishing port wind down and the late light settle over the ramparts. The city feels different at every hour, and the best plan is often to keep the evening open.",
        ],
      },
    ],
  },
  {
    slug: "a-first-taste-of-agadir",
    title: "A first taste of Agadir",
    category: "Local flavour",
    excerpt:
      "From the morning market to a table by the water, discover a few delicious ways to get to know Agadir.",
    image: "photo-1517248135467-4c7edcad34c4",
    imageAlt: "A welcoming restaurant table set for a relaxed Moroccan meal",
    publishedAt: "2026-09-28",
    readingTime: "4 min read",
    location: "Agadir",
    introduction:
      "Agadir’s food tells a story of the coast and the communities around it. Start with the ingredients, follow your appetite, and let a long lunch become the best part of the day.",
    sections: [
      {
        heading: "Follow the morning market",
        paragraphs: [
          "A market visit is a lovely way to understand what is in season. Look for fragrant herbs, bright citrus, and the day’s catch. Go early, take your time, and ask before sampling or photographing.",
        ],
      },
      {
        heading: "Keep lunch simple",
        paragraphs: [
          "Choose a busy place serving what is fresh rather than trying to find the perfect restaurant. Grilled fish, a handful of salads, and good bread make for a meal that feels connected to where you are.",
        ],
      },
      {
        heading: "Save room for tea",
        paragraphs: [
          "Moroccan mint tea is less a final course than an invitation to slow down. Settle in, share a pot, and let the afternoon find its own shape.",
        ],
      },
    ],
  },
  {
    slug: "blue-hour-in-chefchaouen",
    title: "Blue hour in Chefchaouen",
    category: "City notes",
    excerpt:
      "The mountain town is more than its famous blue walls. Take a gentle walk through the medina as the day begins and ends.",
    image: "photo-1539020140153-e479b8c22e70",
    imageAlt: "A quiet blue-washed lane in a Moroccan medina",
    publishedAt: "2026-10-15",
    readingTime: "5 min read",
    location: "Chefchaouen",
    introduction:
      "Chefchaouen is a place to wander without a checklist. Set into the Rif Mountains, its lanes turn and climb at their own pace, opening onto small squares, doorways, and views that invite you to stop.",
    sections: [
      {
        heading: "Walk early, look closely",
        paragraphs: [
          "Before the day fills with visitors, the medina feels especially calm. Follow the lanes uphill, notice how the light changes the painted walls, and take the occasional quiet pause instead of trying to cover every corner.",
          "The blue is part of the town’s character, but so are the wooden doors, flowerpots, and everyday greetings. Keep your camera respectful around homes and people.",
        ],
      },
      {
        heading: "Find a view above the rooftops",
        paragraphs: [
          "A short climb gives you a different sense of the town, with the rooftops gathered beneath the mountains. Bring water, wear comfortable shoes, and leave enough time to enjoy the view rather than just reach it.",
        ],
      },
      {
        heading: "Let the evening settle in",
        paragraphs: [
          "Return to the square as the light softens. Order tea, listen to the town shift into evening, and let the walk back be part of the experience.",
        ],
      },
    ],
  },
  {
    slug: "a-day-in-the-anti-atlas",
    title: "A day in the Anti-Atlas",
    category: "Beyond the city",
    excerpt:
      "Trade the coast for open horizons, mountain villages, and a day that moves to the rhythm of the road.",
    image: "photo-1464822759023-fed622ff2c3b",
    imageAlt: "Mountain ridges beneath a wide open sky",
    publishedAt: "2026-10-18",
    readingTime: "6 min read",
    location: "Anti-Atlas",
    introduction:
      "South of Agadir, the Anti-Atlas opens into a landscape of wide valleys, rocky slopes, and villages shaped by their surroundings. It is a rewarding day out when you give the journey enough time.",
    sections: [
      {
        heading: "Make the drive part of the plan",
        paragraphs: [
          "Distances can feel different once you leave the coast. Set off early, agree on a relaxed route, and plan for pauses along the way. A local driver or guide can help you understand the places between the landmarks.",
        ],
      },
      {
        heading: "Travel with care",
        paragraphs: [
          "When passing through villages, dress thoughtfully, ask before taking photographs, and follow your host’s lead. Buying a tea or a small local product is a simple way to support the places that welcome you.",
        ],
      },
      {
        heading: "Leave space for the view",
        paragraphs: [
          "The mountains are not a backdrop to rush past. Find a safe place to stop, take in the scale of the landscape, and enjoy how different the air feels from the shore.",
        ],
      },
    ],
  },
  {
    slug: "taghazout-between-surf-sessions",
    title: "Taghazout between surf sessions",
    category: "Coast & culture",
    excerpt:
      "A surf trip is better with room to breathe. Discover the small rituals that make a slower day by the Atlantic.",
    image: "photo-1502680390469-be75c86b636f",
    imageAlt: "Surfer looking out toward a clean Atlantic wave",
    publishedAt: "2026-10-21",
    readingTime: "4 min read",
    location: "Taghazout",
    introduction:
      "Taghazout has its own easy rhythm: check the waves, find a good breakfast, and let the rest of the day follow. You don’t need to surf every hour to feel close to the ocean here.",
    sections: [
      {
        heading: "Start with the conditions",
        paragraphs: [
          "The Atlantic changes from day to day. Check the local forecast, choose a break that matches your experience, and ask a local instructor if you’re unsure. A safer session is always a better one.",
        ],
      },
      {
        heading: "Take a proper break",
        paragraphs: [
          "After the water, dry off, get something to eat, and give yourself a little time away from the board. A relaxed lunch and a walk through the village can be every bit as memorable as catching a wave.",
        ],
      },
      {
        heading: "Watch the coast at sunset",
        paragraphs: [
          "As the light drops, find a comfortable spot to watch the shoreline. Keep the evening open and let the day end without another schedule to chase.",
        ],
      },
    ],
  },
  {
    slug: "the-quiet-ritual-of-a-moroccan-hammam",
    title: "The quiet ritual of a Moroccan hammam",
    category: "Slow moments",
    excerpt:
      "A hammam is a chance to pause and reset. Here’s what to expect, and how to make your first visit feel comfortable.",
    image: "photo-1600334129128-685c5582fd35",
    imageAlt: "A calm spa interior prepared for a restorative visit",
    publishedAt: "2026-10-24",
    readingTime: "5 min read",
    location: "Morocco",
    introduction:
      "A hammam can be one of the most restorative pauses in a busy trip. The experience varies from place to place, but the idea is simple: slow down, warm up, and make time to care for yourself.",
    sections: [
      {
        heading: "Choose the experience that suits you",
        paragraphs: [
          "Some hammams are local neighbourhood spaces; others are set up for visitors and offer treatments in a more private setting. Ask what is included before you book, and choose the level of guidance and privacy that feels right for you.",
        ],
      },
      {
        heading: "Ask, then settle in",
        paragraphs: [
          "Check what to bring, what to wear, and how long the visit usually takes. Staff are used to first-time questions. You can always ask for adjustments or decline any part of the service.",
        ],
      },
      {
        heading: "Leave room afterward",
        paragraphs: [
          "Give yourself time to cool down and rehydrate before heading back out. A hammam is not a stop to squeeze between appointments; it is a gentle reset for the rest of your day.",
        ],
      },
    ],
  },
  {
    slug: "what-to-pack-for-the-moroccan-coast",
    title: "What to pack for the Moroccan coast",
    category: "Travel well",
    excerpt:
      "A practical, light-touch packing list for days that move between the beach, the medina, and dinner by the water.",
    image: "photo-1507525428034-b723cf961d3e",
    imageAlt: "A sunlit Atlantic beach with gentle waves",
    publishedAt: "2026-10-27",
    readingTime: "4 min read",
    location: "Atlantic coast",
    introduction:
      "Coastal days can shift from bright sun to a breezy evening quickly. A few flexible layers and useful essentials will take you further than packing for every possible plan.",
    sections: [
      {
        heading: "Bring layers, not a whole wardrobe",
        paragraphs: [
          "Lightweight clothes work well for warm afternoons, while a long-sleeved layer is useful when the ocean breeze picks up. Comfortable walking shoes will serve you in town and on uneven streets.",
        ],
      },
      {
        heading: "Keep sun and sea in mind",
        paragraphs: [
          "Pack sun protection, a reusable water bottle, and a small day bag. If you plan to swim or surf, bring a quick-drying layer and check what equipment is available locally before filling your suitcase.",
        ],
      },
      {
        heading: "Pack with local places in mind",
        paragraphs: [
          "A light scarf or an extra layer can be handy when visiting more conservative settings. Keep valuables simple, carry a little cash for small purchases, and leave space to bring home something you find along the way.",
        ],
      },
    ],
  },
];

export function getBlogBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogImageUrl(image: string, width = 1000) {
  if (/^https?:\/\//i.test(image)) return image;
  return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=85`;
}

export function formatBlogDate(date: string, locale: "en" | "fr" = "en") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
