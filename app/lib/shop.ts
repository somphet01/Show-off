export type ShopCategory = {
  title: string;
  items: string[];
};

export type CollectionProduct = {
  slug: string;
  name: string;
  category?: string;
  color: string;
  price: string;
  colors: number;
  swatches?: string[];
  swatchHexes?: string[];
  swatchLabels?: string[];
  image: string;
  cardImages?: Record<string, string[]>;
  gallery?: string[];
  detailImages?: string[];
  colourImages?: Record<string, string[]>;
  variantSizes?: Record<string, string[]>;
  variantStockByColor?: Record<string, Record<string, number>>;
  badge?: string;
};

export const shopCategories: ShopCategory[] = [
  {
    title: "Clothing",
    items: ["T-Shirts", "Oversized T-Shirts", "Shirts", "Polos", "Long Sleeve", "Hoodies", "Sweaters", "Jackets", "Jeans", "Pants", "Shorts", "Sets"],
  },
  {
    title: "Footwear",
    items: ["Sneakers", "Slides & Sandals", "Leather Shoes", "Boots", "Casual Shoes"],
  },
  {
    title: "Eyewear",
    items: ["Sunglasses", "Fashion Glasses", "Clear Frame", "Sport Glasses"],
  },
  {
    title: "Hats & Caps",
    items: ["Baseball Caps", "Dad Hat", "Snapback", "Trucker Cap", "Bucket Hat", "Beanie"],
  },
  {
    title: "Accessories",
    items: ["Necklaces", "Pendants", "Rings", "Earrings", "Bracelets", "Watches", "Belts", "Keychains"],
  },
  {
    title: "Bags",
    items: ["Crossbody Bags", "Chest Bags", "Waist Bags"],
  },
];

export const collectionProducts: CollectionProduct[] = [];

export function slugify(value: string) {
  return value.toLowerCase().replaceAll("&", "and").replaceAll(" ", "-");
}

export function titleFromSlug(slug: string) {
  const known = [shopCategories.map((category) => category.title), shopCategories.flatMap((category) => category.items)].flat().find((item) => slugify(item) === slug);

  if (known) {
    return known;
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function productFromSlug(slug: string) {
  return collectionProducts.find((product) => product.slug === slug);
}

const collectionKeywordMap: Record<string, string[]> = {
  jackets: ["jacket"],
  jeans: ["jean"],
  "baggy-jeans": ["jean"],
  pants: ["pant", "sweatpant", "cargo"],
  shorts: ["short"],
  hoodies: ["hoodie"],
  sweaters: ["sweater"],
  "t-shirts": ["t-shirt"],
  "oversized-t-shirts": ["oversized t-shirt"],
  shirts: ["shirt", "jersey"],
  "long-sleeve": ["long sleeve"],
  polos: ["polo"],
  "hats-and-caps": ["cap", "hat", "beanie"],
  "baseball-caps": ["cap"],
};

const collectionCategoryAliases: Record<string, string[]> = {
  "baggy-jeans": ["jeans"],
  "t-shirts": ["t-shirts", "oversized-t-shirts"],
};

export function productsForCollectionSlug(slug: string, sourceProducts: CollectionProduct[] = collectionProducts) {
  const normalizedSlug = slugify(slug);
  const aliasSlugs = collectionCategoryAliases[normalizedSlug] ?? [];
  const exactCategoryMatches = sourceProducts.filter((product) => {
    if (!product.category) return false;
    const categorySlug = slugify(product.category);
    return categorySlug === normalizedSlug || aliasSlugs.includes(categorySlug);
  });

  if (exactCategoryMatches.length > 0) {
    return exactCategoryMatches;
  }

  const group = shopCategories.find((category) => slugify(category.title) === normalizedSlug);
  if (group) {
    const groupItemSlugs = new Set(group.items.map(slugify));
    return sourceProducts.filter((product) => product.category && groupItemSlugs.has(slugify(product.category)));
  }

  const keywords = collectionKeywordMap[slug];

  if (!keywords) {
    return [];
  }

  const matchedProducts = sourceProducts.filter((product) => {
    const haystack = `${product.category ?? ""} ${product.name} ${product.slug}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });

  return matchedProducts;
}
