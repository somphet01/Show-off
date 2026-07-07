export type SiteMediaType = "image" | "video";

export type HomeCoverSlot = {
  id: string;
  title: string;
  label: string;
  asset: string;
  link: string;
  cta: string;
  mediaType: SiteMediaType;
  enabled: boolean;
};

export type IntroSettings = {
  enabled: boolean;
  mediaType: SiteMediaType;
  src: string;
  audioEnabled: boolean;
  fadeMs: number;
  durationMs: number;
  showOncePerVisit: boolean;
};

export type SiteContentSettings = {
  covers: HomeCoverSlot[];
  intro: IntroSettings;
};

export const defaultHomeCovers: HomeCoverSlot[] = [
  {
    id: "home-hero",
    title: "Built to Stand Out",
    label: "Jackets",
    asset: "/assets/cover-main.png",
    link: "/collections/jackets",
    cta: "SHOP NOW",
    mediaType: "image",
    enabled: true,
  },
  {
    id: "baggy-jeans",
    title: "Built Different",
    label: "Baggy Jeans",
    asset: "/assets/campaign-dark.png",
    link: "/collections/baggy-jeans",
    cta: "NEW ARRIVALS",
    mediaType: "image",
    enabled: true,
  },
  {
    id: "premium-tees",
    title: "Premium Boxy Tees",
    label: "Made to Stand Out",
    asset: "/assets/campaign-motel.png",
    link: "/collections/t-shirts",
    cta: "SHOP THE DROP",
    mediaType: "image",
    enabled: true,
  },
  {
    id: "accessories-campaign",
    title: "Essential Accessories",
    label: "Complete Your Look",
    asset: "/assets/campaign-moto.png",
    link: "/collections/accessories",
    cta: "SHOP ACCESSORIES",
    mediaType: "image",
    enabled: true,
  },
  {
    id: "hoodies-campaign",
    title: "Essential Hoodies",
    label: "Built for Everyday",
    asset: "/assets/campaign-beach.png",
    link: "/collections/hoodies",
    cta: "DISCOVER MORE",
    mediaType: "image",
    enabled: true,
  },
];

export const defaultIntroSettings: IntroSettings = {
  enabled: true,
  mediaType: "video",
  src: "/assets/show-off-intro.mp4",
  audioEnabled: true,
  fadeMs: 700,
  durationMs: 5200,
  showOncePerVisit: true,
};

function isMediaType(value: unknown): value is SiteMediaType {
  return value === "image" || value === "video";
}

function cleanText(value: unknown, fallback: string, maxLength = 180) {
  const text = String(value ?? "").trim().slice(0, maxLength);
  return text || fallback;
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, Math.round(numeric))) : fallback;
}

export function normalizeSiteContent(value: unknown): SiteContentSettings {
  const payload = value && typeof value === "object" ? (value as Partial<SiteContentSettings>) : {};
  const sourceCovers = Array.isArray(payload.covers) ? payload.covers : [];
  const covers = defaultHomeCovers.map((fallback, index) => {
    const source = sourceCovers[index] && typeof sourceCovers[index] === "object" ? sourceCovers[index] : {};
    const slot = source as Partial<HomeCoverSlot>;

    return {
      id: cleanText(slot.id, fallback.id, 60),
      title: cleanText(slot.title, fallback.title),
      label: cleanText(slot.label, fallback.label, 90),
      asset: cleanText(slot.asset, fallback.asset, 1000),
      link: cleanText(slot.link, fallback.link, 500),
      cta: cleanText(slot.cta, fallback.cta, 90),
      mediaType: isMediaType(slot.mediaType) ? slot.mediaType : fallback.mediaType,
      enabled: typeof slot.enabled === "boolean" ? slot.enabled : fallback.enabled,
    };
  });
  const sourceIntro = payload.intro && typeof payload.intro === "object" ? payload.intro : {};
  const intro = sourceIntro as Partial<IntroSettings>;

  return {
    covers,
    intro: {
      enabled: typeof intro.enabled === "boolean" ? intro.enabled : defaultIntroSettings.enabled,
      mediaType: isMediaType(intro.mediaType) ? intro.mediaType : defaultIntroSettings.mediaType,
      src: cleanText(intro.src, defaultIntroSettings.src, 1000),
      audioEnabled: typeof intro.audioEnabled === "boolean" ? intro.audioEnabled : defaultIntroSettings.audioEnabled,
      fadeMs: cleanNumber(intro.fadeMs, defaultIntroSettings.fadeMs, 0, 5000),
      durationMs: cleanNumber(intro.durationMs, defaultIntroSettings.durationMs, 500, 30000),
      showOncePerVisit:
        typeof intro.showOncePerVisit === "boolean" ? intro.showOncePerVisit : defaultIntroSettings.showOncePerVisit,
    },
  };
}
