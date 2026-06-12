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
      label: "Discover",
      title: "Champions Collection",
      cta: "New Arrivals",
    },
    beach: {
      label: "Now Live",
      title: "Represent X Beach Boys",
      countdown: "03D:10H:17M:13S",
      cta: "Discover More",
      secondaryCta: "View Lookbook",
    },
    campaigns: {
      summer: "Summer Capsule",
      technical: "Technical Terrain",
      belstaffLabel: "Now Live",
      belstaff: "Represent x Belstaff",
      heatonLabel: "Coming Soon",
      heavyweight: "Heaton SS26",
      accessories: "New Arrivals",
      shopNow: "Shop Now",
      shopOuterwear: "Shop Outerwear",
      shopAccessories: "Shop Accessories",
    },
    products: {
      shopNewArrivals: "Shop New Arrivals",
      ctas: {
        beach: "Shop Beach Boys",
        champion: "Shop New Arrivals",
        summer: "Shop Summer",
        belstaff: "Shop Belstaff",
        heaton: "Shop Heaton",
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
    languageName: "ລາວ",
    switchLabel: "EN",
    nav: {
      shop: "ຮ້ານຄ້າ",
      retail: "ຂາຍປີກ",
      vault: "ຄັງສະສົມ",
      prestige: "Prestige",
      currency: "LA / USD",
    },
    hero: {
      label: "ຄົ້ນພົບ",
      title: "Champions Collection",
      cta: "ສິນຄ້າໃໝ່",
    },
    beach: {
      label: "ພ້ອມຊື້",
      title: "Represent X Beach Boys",
      countdown: "03D:10H:17M:13S",
      cta: "ເບິ່ງເພີ່ມ",
      secondaryCta: "ເບິ່ງ Lookbook",
    },
    campaigns: {
      summer: "Summer Capsule",
      technical: "ເສື້ອຜ້າເທັກນິກ",
      belstaffLabel: "ພ້ອມຊື້",
      belstaff: "Represent x Belstaff",
      heatonLabel: "ໃກ້ຈະມາ",
      heavyweight: "Heaton SS26",
      accessories: "ສິນຄ້າໃໝ່",
      shopNow: "ຊື້ຕອນນີ້",
      shopOuterwear: "ຊື້ເສື້ອນອກ",
      shopAccessories: "ຊື້ອຸປະກອນ",
    },
    products: {
      shopNewArrivals: "ເລືອກຊື້ສິນຄ້າໃໝ່ລ່າສຸດ",
      ctas: {
        beach: "Shop Beach Boys",
        champion: "Shop New Arrivals",
        summer: "Shop Summer",
        belstaff: "Shop Belstaff",
        heaton: "Shop Heaton",
      },
      oneColour: "1 ສີ",
      twoColours: "2 ສີ",
      colours: {
        jetBlack: "ສີດຳສະນິດ",
        washedBlack: "ສີດຳຟອກ",
        englishRose: "English Rose",
        flatWhite: "ສີຂາວ",
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
        ["ສິນຄ້າໃໝ່", "Outerwear", "Jersey", "Womenswear"],
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
