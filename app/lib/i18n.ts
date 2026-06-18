export const locales = ["en", "lo"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const dictionaries = {
  en: {
    languageName: "English",
    switchLabel: "LO",
    nav: {
      shop: "Shop",
      retail: "Retail",
      vault: "The Vault",
      prestige: "Prestige",
      currency: "LA / USD",
    },
    hero: {
      label: "Baggy Jeans",
      title: "Built Different",
      cta: "New Arrivals",
    },
    beach: {
      label: "Jackets",
      title: "Built to Stand Out",
      countdown: "03D:10H:17M:13S",
      cta: "Discover More",
      secondaryCta: "View Lookbook",
    },
    campaigns: {
      summerLabel: "Made to Stand Out",
      summer: "Premium Boxy Tees",
      shopTheDrop: "Shop The Drop",
      technical: "Technical Terrain",
      belstaffLabel: "Complete Your Look",
      belstaff: "Essential Accessories",
      heatonLabel: "Built for Everyday",
      heavyweight: "Essential Hoodies",
      accessories: "New Arrivals",
      shopNow: "Shop Now",
      shopOuterwear: "Shop Outerwear",
      shopAccessories: "Shop Accessories",
      discoverMore: "Discover More",
    },
    products: {
      shopNewArrivals: "Shop New Arrivals",
      ctas: {
        beach: "View All",
        champion: "View All",
        summer: "View All",
        belstaff: "View All",
        heaton: "View All",
      },
      oneColour: "1 Colour",
      twoColours: "2 Colours",
      colours: {
        jetBlack: "Jet Black",
        washedBlack: "Washed Black",
        englishRose: "English Rose",
        flatWhite: "Flat White",
        cobalt: "Cobalt",
        bone: "Bone",
        powderBlue: "Powder Blue",
        washedBlue: "Washed Blue",
        earth: "Earth",
        skyBlue: "Sky Blue",
      },
      champion: [
        "Track Star Jacket",
        "Thoroughbred Jersey",
        "Thoroughbred Jersey",
        "Spike Jersey",
        "Star Jersey",
        "Star Long Sleeve",
      ],
      rows: [
        ["Beach Boys Americas Band Sweater", "Beach Boys Endless Summer T-Shirt", "Beach Boys Tour T-Shirt", "Beach Boys Cap", "Beach Boys Hoodie"],
        ["Summer Graphic T-Shirt", "Open Hem Sweatpant", "Cowboys Vintage T-Shirt", "Summer Jersey", "Relaxed Short"],
        ["Belstaff Storm Shell", "Belstaff Moto Jacket", "Initial Hoodie", "Powder Blue Hoodie", "Utility Cargo Pant"],
      ],
    },
    categories: {
      ownersClub: "Owners Club",
      initial: "Initial",
    },
    footer: {
      description: "Prestige loyalty, exclusive releases, private access, and member-first rewards.",
      columns: [
        ["New Arrivals", "Outerwear", "Jersey", "Womenswear"],
        ["Explore", "Campaigns", "Stores", "About"],
        ["Help Centre", "Shipping", "Returns", "Contact"],
      ],
    },
    explore: {
      label: "Explore collections",
      title: "Explore collections",
      items: ["New Arrivals", "247", "Owners Club", "Initial", "Womenswear"],
    },
    prestige: {
      label: "Prestige Loyalty",
      title: "Prestige Loyalty",
      cta: "Join Prestige",
    },
  },
  lo: {
    languageName: "àº¥àº²àº§",
    switchLabel: "EN",
    nav: {
      shop: "àº®à»‰àº²àº™àº„à»‰àº²",
      retail: "àº‚àº²àºàº›àºµàº",
      vault: "àº„àº±àº‡àºªàº°àºªàº»àº¡",
      prestige: "Prestige",
      currency: "LA / USD",
    },
    hero: {
      label: "Baggy Jeans",
      title: "Built Different",
      cta: "àºªàº´àº™àº„à»‰àº²à»ƒà»à»ˆ",
    },
    beach: {
      label: "Jackets",
      title: "Built to Stand Out",
      countdown: "03D:10H:17M:13S",
      cta: "à»€àºšàº´à»ˆàº‡à»€àºžàºµà»ˆàº¡",
      secondaryCta: "à»€àºšàº´à»ˆàº‡ Lookbook",
    },
    campaigns: {
      summerLabel: "Made to Stand Out",
      summer: "Premium Boxy Tees",
      shopTheDrop: "Shop The Drop",
      technical: "à»€àºªàº·à»‰àº­àºœà»‰àº²à»€àº—àº±àºàº™àº´àº",
      belstaffLabel: "Complete Your Look",
      belstaff: "Essential Accessories",
      heatonLabel: "Built for Everyday",
      heavyweight: "Essential Hoodies",
      accessories: "àºªàº´àº™àº„à»‰àº²à»ƒà»à»ˆ",
      shopNow: "àºŠàº·à»‰àº•àº­àº™àº™àºµà»‰",
      shopOuterwear: "àºŠàº·à»‰à»€àºªàº·à»‰àº­àº™àº­àº",
      shopAccessories: "Shop Accessories",
      discoverMore: "Discover More",
    },
    products: {
      shopNewArrivals: "à»€àº¥àº·àº­àºàºŠàº·à»‰àºªàº´àº™àº„à»‰àº²à»ƒà»à»ˆàº¥à»ˆàº²àºªàº¸àº”",
      ctas: {
        beach: "View All",
        champion: "View All",
        summer: "View All",
        belstaff: "View All",
        heaton: "View All",
      },
      oneColour: "1 àºªàºµ",
      twoColours: "2 àºªàºµ",
      colours: {
        jetBlack: "àºªàºµàº”àº³àºªàº°àº™àº´àº”",
        washedBlack: "àºªàºµàº”àº³àºŸàº­àº",
        englishRose: "English Rose",
        flatWhite: "àºªàºµàº‚àº²àº§",
        cobalt: "Cobalt",
        bone: "Bone",
        powderBlue: "Powder Blue",
        washedBlue: "Washed Blue",
        earth: "Earth",
        skyBlue: "Sky Blue",
      },
      champion: [
        "Track Star Jacket",
        "Thoroughbred Jersey",
        "Thoroughbred Jersey",
        "Spike Jersey",
        "Star Jersey",
        "Star Long Sleeve",
      ],
      rows: [
        ["Beach Boys Americas Band Sweater", "Beach Boys Endless Summer T-Shirt", "Beach Boys Tour T-Shirt", "Beach Boys Cap", "Beach Boys Hoodie"],
        ["Summer Graphic T-Shirt", "Open Hem Sweatpant", "Cowboys Vintage T-Shirt", "Summer Jersey", "Relaxed Short"],
        ["Belstaff Storm Shell", "Belstaff Moto Jacket", "Initial Hoodie", "Powder Blue Hoodie", "Utility Cargo Pant"],
      ],
    },
    categories: {
      ownersClub: "Owners Club",
      initial: "Initial",
    },
    footer: {
      description: "Prestige loyalty, exclusive releases, private access, and member-first rewards.",
      columns: [
        ["àºªàº´àº™àº„à»‰àº²à»ƒà»à»ˆ", "Outerwear", "Jersey", "Womenswear"],
        ["Explore", "Campaigns", "Stores", "About"],
        ["Help Centre", "Shipping", "Returns", "Contact"],
      ],
    },
    explore: {
      label: "Explore collections",
      title: "Explore collections",
      items: ["New Arrivals", "247", "Owners Club", "Initial", "Womenswear"],
    },
    prestige: {
      label: "Prestige Loyalty",
      title: "Prestige Loyalty",
      cta: "Join Prestige",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

