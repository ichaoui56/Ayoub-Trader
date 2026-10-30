export type SiteSeoSettings = {
  siteName: string;
  siteUrl: string;
  titleTemplate: string;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  keywordsEn: string;
  keywordsFr: string;
  activitiesTitleEn: string;
  activitiesTitleFr: string;
  activitiesDescriptionEn: string;
  activitiesDescriptionFr: string;
  journalTitleEn: string;
  journalTitleFr: string;
  journalDescriptionEn: string;
  journalDescriptionFr: string;
  openGraphTitleEn: string;
  openGraphTitleFr: string;
  openGraphDescriptionEn: string;
  openGraphDescriptionFr: string;
  openGraphImage: string;
  twitterHandle: string;
  googleVerification: string;
  bingVerification: string;
  allowIndexing: boolean;
  allowFollowing: boolean;
  organizationName: string;
  organizationLogo: string;
  socialProfiles: string[];
};

export const siteSeoSettingKey = "site-seo-v1";

export function getDefaultSiteSeoSettings(): SiteSeoSettings {
  return {
    siteName: "Morocco Journeys",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://moroccojourneys.com",
    titleTemplate: "%s | Morocco Journeys",
    titleEn: "Morocco Journeys — Every arrival, considered.",
    titleFr: "Morocco Journeys — Chaque arrivée, pensée avec soin.",
    descriptionEn: "A thoughtful Morocco concierge for seamless airport transfers, handpicked stays and unforgettable local experiences.",
    descriptionFr: "Une conciergerie marocaine attentive pour vos transferts aéroport, hébergements choisis et expériences locales inoubliables.",
    keywordsEn: "Morocco travel, Morocco concierge, Agadir transfers, Taghazout experiences",
    keywordsFr: "voyage Maroc, conciergerie Maroc, transferts Agadir, expériences Taghazout",
    activitiesTitleEn: "Morocco Activities & Experiences",
    activitiesTitleFr: "Activités et expériences au Maroc",
    activitiesDescriptionEn: "Explore outdoor adventures, ocean activities, local culture, food, and wellbeing experiences around Agadir and Taghazout.",
    activitiesDescriptionFr: "Découvrez les aventures, les activités nautiques, la culture, la gastronomie et le bien-être autour d’Agadir et de Taghazout.",
    journalTitleEn: "The Morocco Travel Journal",
    journalTitleFr: "Le carnet de voyage du Maroc",
    journalDescriptionEn: "Local perspectives, thoughtful travel notes, and inspiration for a more considered journey through Morocco.",
    journalDescriptionFr: "Regards locaux, récits de voyage et inspirations pour découvrir le Maroc autrement.",
    openGraphTitleEn: "Morocco Journeys — Every arrival, considered.",
    openGraphTitleFr: "Morocco Journeys — Chaque arrivée, pensée avec soin.",
    openGraphDescriptionEn: "A thoughtful Morocco concierge for seamless airport transfers, handpicked stays and unforgettable local experiences.",
    openGraphDescriptionFr: "Une conciergerie marocaine attentive pour vos transferts aéroport, hébergements choisis et expériences locales inoubliables.",
    openGraphImage: "",
    twitterHandle: "",
    googleVerification: "",
    bingVerification: "",
    allowIndexing: true,
    allowFollowing: true,
    organizationName: "Morocco Journeys",
    organizationLogo: "",
    socialProfiles: [],
  };
}

export function getSeoImageUrl(image: string) {
  return /^photo-[a-zA-Z0-9-]+$/.test(image)
    ? `https://images.unsplash.com/${image}?auto=format&fit=crop&w=1200&q=85`
    : image;
}