export type ShopCategory = {
  title: string;
  items: string[];
};

export type CollectionProduct = {
  slug: string;
  name: string;
  color: string;
  price: string;
  colors: number;
  swatches?: string[];
  image: string;
  gallery?: string[];
  colourImages?: Record<string, string[]>;
  variantSizes?: Record<string, string[]>;
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

export const collectionProducts: CollectionProduct[] = [
  {
    slug: "retro-patchwork-striped-color-block-short",
    name: "Retro Patchwork Striped Color Block Short",
    color: "Red",
    price: "฿1,300",
    colors: 2,
    swatches: ["red", "black"],
    image: "/assets/real-retro-red-front.jpg",
    gallery: ["/assets/real-retro-red-front.jpg", "/assets/real-retro-red-model.jpg"],
    colourImages: {
      Red: ["/assets/real-retro-red-front.jpg", "/assets/real-retro-red-model.jpg"],
      Black: ["/assets/real-retro-black-front.jpg", "/assets/real-retro-black-model.jpg"],
    },
    variantSizes: {
      Red: ["L", "XL", "XXL"],
      Black: ["M", "L", "XL"],
    },
    badge: "SALE",
  },
  { slug: "pegasus-zip-through-hoodie-indigo", name: "Team 247 Oversized T-Shirt", color: "Black", price: "฿60", colors: 6, image: "/assets/ref-247-black-tee.png", badge: "SALE" },
  { slug: "british-cowboys-hoodie-stained-black", name: "247 Oversized Tank", color: "Jet Black", price: "฿59", colors: 2, image: "/assets/ref-247-black-tank.png", badge: "SALE" },
  { slug: "owners-club-hoodie-washed-black", name: "Team 247 Oversized T-Shirt", color: "Jet Black", price: "฿63", colors: 6, image: "/assets/ref-247-black-tee-2.png", badge: "Restocked" },
  { slug: "atlas-graphic-hoodie-flat-white", name: "247 Oversized T-Shirt", color: "Flat White", price: "฿61", colors: 6, image: "/assets/ref-247-white-tee.png", badge: "SALE" },
  { slug: "initial-jersey-hoodie-jet-black", name: "Team 247 Oversized T-Shirt", color: "Jet Black", price: "฿63", colors: 6, image: "/assets/ref-247-black-tee.png", badge: "Restocked" },
  { slug: "represent-relaxed-hoodie-cobalt", name: "Represent Relaxed Hoodie", color: "Cobalt", price: "฿4,800", colors: 3, image: "/assets/product-black-pants.jpeg" },
  { slug: "beach-boys-tour-hoodie-powder-blue", name: "Beach Boys Tour Hoodie", color: "Powder Blue", price: "฿5,200", colors: 1, image: "/assets/product-red-jacket.jpeg" },
  { slug: "track-star-jacket", name: "Track Star Jacket", color: "Jet Black", price: "฿6,300", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "thoroughbred-jersey-washed-black", name: "Thoroughbred Jersey", color: "Washed Black", price: "฿3,600", colors: 2, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "thoroughbred-jersey-english-rose", name: "Thoroughbred Jersey", color: "English Rose", price: "฿3,600", colors: 2, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "spike-jersey-flat-white", name: "Spike Jersey", color: "Flat White", price: "฿3,300", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "star-jersey-jet-black", name: "Star Jersey", color: "Jet Black", price: "฿3,300", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "star-long-sleeve-jet-black", name: "Star Long Sleeve", color: "Jet Black", price: "฿3,400", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-americas-band-sweater", name: "Beach Boys Americas Band Sweater", color: "Flat White", price: "฿1,900", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-endless-summer-t-shirt", name: "Beach Boys Endless Summer T-Shirt", color: "Washed Black", price: "฿2,100", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-tour-t-shirt", name: "Beach Boys Tour T-Shirt", color: "Jet Black", price: "฿2,200", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-cap", name: "Beach Boys Cap", color: "Flat White", price: "฿1,800", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-hoodie", name: "Beach Boys Hoodie", color: "Sky Blue", price: "฿2,400", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "summer-graphic-t-shirt", name: "Summer Graphic T-Shirt", color: "Cobalt", price: "฿5,700", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "open-hem-sweatpant", name: "Open Hem Sweatpant", color: "Bone", price: "฿6,800", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "cowboys-vintage-t-shirt", name: "Cowboys Vintage T-Shirt", color: "Jet Black", price: "฿3,800", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "summer-jersey", name: "Summer Jersey", color: "Powder Blue", price: "฿3,800", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "relaxed-short", name: "Relaxed Short", color: "Jet Black", price: "฿4,200", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "belstaff-storm-shell", name: "Belstaff Storm Shell", color: "Washed Blue", price: "฿3,600", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "belstaff-moto-jacket", name: "Belstaff Moto Jacket", color: "Jet Black", price: "฿3,600", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "initial-hoodie", name: "Initial Hoodie", color: "Earth", price: "฿3,600", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "powder-blue-hoodie", name: "Powder Blue Hoodie", color: "Flat White", price: "฿3,000", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "utility-cargo-pant", name: "Utility Cargo Pant", color: "Jet Black", price: "฿3,100", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
];

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
