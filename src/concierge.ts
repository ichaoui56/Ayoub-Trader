import type { Locale } from "./i18n";

export type LocalizedText = Partial<Record<Locale, string>> & { en: string; fr: string };

export type ConciergeValue = {
  title: LocalizedText;
  description: LocalizedText;
};

export type ConciergeSectionSettings = {
  enabled: boolean;
  sectionId: string;
  image: string;
  imageIndexNumber: string;
  eyebrow: LocalizedText;
  establishment: LocalizedText;
  imageAlt: LocalizedText;
  imageOverline: LocalizedText;
  imageCaption: LocalizedText;
  seal: LocalizedText[];
  imageIndex: LocalizedText;
  kicker: LocalizedText;
  headingOne: LocalizedText;
  headingTwo: LocalizedText;
  headingThree: LocalizedText;
  headingAccent: LocalizedText;
  body: LocalizedText;
  values: ConciergeValue[];
  ctaLabel: LocalizedText;
  ctaHref: string;
  footerStart: LocalizedText;
  footerEnd: LocalizedText;
};

const defaults: ConciergeSectionSettings = {
  enabled: true,
  sectionId: "concierge",
  image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1500&q=85",
  imageIndexNumber: "01",
  eyebrow: { en: "Our story", fr: "Notre histoire" },
  establishment: { en: "EST. WITH CARE · MOROCCO", fr: "CRÉÉ AVEC SOIN · MAROC" },
  imageAlt: {
    en: "A warm sunset over the rooftops and minarets of a Moroccan city",
    fr: "Un coucher de soleil chaleureux sur les toits et les minarets d’une ville marocaine",
  },
  imageOverline: { en: "MADE FOR THE WAY YOU TRAVEL", fr: "PENSÉ POUR VOTRE FAÇON DE VOYAGER" },
  imageCaption: { en: "Morocco, a little closer.", fr: "Le Maroc, un peu plus proche." },
  seal: [
    { en: "LOCAL", fr: "LOCAL" },
    { en: "HEART", fr: "CŒUR" },
    { en: "OPEN", fr: "GRANDS" },
    { en: "ROADS", fr: "ESPACES" },
  ],
  imageIndex: { en: "A DIFFERENT KIND OF JOURNEY", fr: "UNE AUTRE FAÇON DE VOYAGER" },
  kicker: { en: "BUILT AROUND YOU", fr: "PENSÉ AUTOUR DE VOUS" },
  headingOne: { en: "Your trip.", fr: "Votre voyage." },
  headingTwo: { en: "Your pace.", fr: "Votre rythme." },
  headingThree: { en: "Your kind of", fr: "Votre façon de vivre le" },
  headingAccent: { en: "Morocco.", fr: "Maroc." },
  body: {
    en: "We believe the best journeys feel effortless, personal, and full of moments you didn’t plan for. We bring the details together—from the first airport pickup to the local places you’ll remember long after you leave.",
    fr: "Nous croyons que les plus beaux voyages sont simples, personnels et remplis d’instants imprévus. Nous coordonnons chaque détail, de votre accueil à l’aéroport aux adresses locales dont vous vous souviendrez longtemps.",
  },
  values: [
    {
      title: { en: "Thoughtful by nature", fr: "L’attention dans chaque détail" },
      description: { en: "Details considered before you arrive.", fr: "Chaque détail est pensé avant votre arrivée." },
    },
    {
      title: { en: "Rooted in Morocco", fr: "Ancré au Maroc" },
      description: { en: "Local knowledge, genuine connections.", fr: "Une connaissance locale et des rencontres authentiques." },
    },
    {
      title: { en: "Always your journey", fr: "Toujours votre voyage" },
      description: { en: "Made to move at your own pace.", fr: "Un voyage à votre rythme." },
    },
  ],
  ctaLabel: { en: "Let’s plan your journey", fr: "Préparons votre voyage" },
  ctaHref: "#contact",
  footerStart: { en: "FROM THE FIRST HELLO", fr: "DU PREMIER BONJOUR" },
  footerEnd: { en: "TO THE STORIES YOU TAKE HOME", fr: "AUX SOUVENIRS QUE VOUS EMPORTEZ" },
};

export function getDefaultConciergeSettings(): ConciergeSectionSettings {
  return structuredClone(defaults);
}

function localized(value: unknown, fallback: LocalizedText): LocalizedText {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return { ...fallback };
  const input = value as Record<string, unknown>;
  return {
    en: typeof input.en === "string" ? input.en : fallback.en,
    fr: typeof input.fr === "string" ? input.fr : fallback.fr,
    ar: typeof input.ar === "string" ? input.ar : fallback.ar,
  };
}

export function normalizeConciergeSettings(value: unknown): ConciergeSectionSettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return getDefaultConciergeSettings();
  const input = value as Record<string, unknown>;
  const result = getDefaultConciergeSettings();

  for (const key of [
    "eyebrow", "establishment", "imageAlt", "imageOverline", "imageCaption", "imageIndex", "kicker",
    "headingOne", "headingTwo", "headingThree", "headingAccent", "body", "ctaLabel", "footerStart", "footerEnd",
  ] as const) {
    result[key] = localized(input[key], result[key]);
  }

  if (typeof input.enabled === "boolean") result.enabled = input.enabled;
  if (typeof input.sectionId === "string" && /^[a-z][a-z0-9-]{0,40}$/.test(input.sectionId)) result.sectionId = input.sectionId;
  if (typeof input.image === "string" && input.image.length <= 1200) result.image = input.image;
  if (typeof input.imageIndexNumber === "string" && /^\d{1,3}$/.test(input.imageIndexNumber)) result.imageIndexNumber = input.imageIndexNumber;
  if (typeof input.ctaHref === "string" && input.ctaHref.length <= 240) result.ctaHref = input.ctaHref;
  if (Array.isArray(input.seal) && input.seal.length === 4) {
    result.seal = input.seal.map((entry, index) => localized(entry, defaults.seal[index]));
  }
  if (Array.isArray(input.values) && input.values.length >= 1 && input.values.length <= 6) {
    result.values = input.values.map((entry, index) => {
      const item = typeof entry === "object" && entry !== null && !Array.isArray(entry)
        ? entry as Record<string, unknown>
        : {};
      const fallback = defaults.values[index] ?? defaults.values[defaults.values.length - 1];
      return {
        title: localized(item.title, fallback.title),
        description: localized(item.description, fallback.description),
      };
    });
  }
  return result;
}