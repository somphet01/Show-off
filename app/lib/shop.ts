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
  image: string;
  gallery?: string[];
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
    slug: "represent-x-beach-boys-americas-band-sweater-ice-grey-marl",
    name: "Represent x Beach Boys Americas Band Sweater",
    color: "Ice Grey Marl",
    price: "4.700.000 LAK",
    colors: 1,
    image: "/assets/product-red-jacket.jpeg",
    gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"],
    badge: "Restocked",
  },
  { slug: "pegasus-zip-through-hoodie-indigo", name: "Pegasus Zip Through Hoodie", color: "Indigo", price: "6.000.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", badge: "Restocked" },
  { slug: "british-cowboys-hoodie-stained-black", name: "British Cowboys Hoodie", color: "Stained Black", price: "5.800.000 LAK", colors: 2, image: "/assets/product-black-pants.jpeg", badge: "Restocked" },
  { slug: "owners-club-hoodie-washed-black", name: "Owners Club Hoodie", color: "Washed Black", price: "4.400.000 LAK", colors: 1, image: "/assets/product-black-pants.jpeg" },
  { slug: "atlas-graphic-hoodie-flat-white", name: "Atlas Graphic Hoodie", color: "Flat White", price: "4.200.000 LAK", colors: 2, image: "/assets/product-red-jacket.jpeg", badge: "Restocked" },
  { slug: "initial-jersey-hoodie-jet-black", name: "Initial Jersey Hoodie", color: "Jet Black", price: "5.000.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg" },
  { slug: "represent-relaxed-hoodie-cobalt", name: "Represent Relaxed Hoodie", color: "Cobalt", price: "4.800.000 LAK", colors: 3, image: "/assets/product-black-pants.jpeg" },
  { slug: "beach-boys-tour-hoodie-powder-blue", name: "Beach Boys Tour Hoodie", color: "Powder Blue", price: "5.200.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg" },
  { slug: "track-star-jacket", name: "Track Star Jacket", color: "Jet Black", price: "6.300.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "thoroughbred-jersey-washed-black", name: "Thoroughbred Jersey", color: "Washed Black", price: "3.600.000 LAK", colors: 2, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "thoroughbred-jersey-english-rose", name: "Thoroughbred Jersey", color: "English Rose", price: "3.600.000 LAK", colors: 2, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "spike-jersey-flat-white", name: "Spike Jersey", color: "Flat White", price: "3.300.000 LAK", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "star-jersey-jet-black", name: "Star Jersey", color: "Jet Black", price: "3.300.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "star-long-sleeve-jet-black", name: "Star Long Sleeve", color: "Jet Black", price: "3.400.000 LAK", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-americas-band-sweater", name: "Beach Boys Americas Band Sweater", color: "Flat White", price: "1.900.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-endless-summer-t-shirt", name: "Beach Boys Endless Summer T-Shirt", color: "Washed Black", price: "2.100.000 LAK", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-tour-t-shirt", name: "Beach Boys Tour T-Shirt", color: "Jet Black", price: "2.200.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-cap", name: "Beach Boys Cap", color: "Flat White", price: "1.800.000 LAK", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "beach-boys-hoodie", name: "Beach Boys Hoodie", color: "Sky Blue", price: "2.400.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "summer-graphic-t-shirt", name: "Summer Graphic T-Shirt", color: "Cobalt", price: "5.700.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "open-hem-sweatpant", name: "Open Hem Sweatpant", color: "Bone", price: "6.800.000 LAK", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "cowboys-vintage-t-shirt", name: "Cowboys Vintage T-Shirt", color: "Jet Black", price: "3.800.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "summer-jersey", name: "Summer Jersey", color: "Powder Blue", price: "3.800.000 LAK", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "relaxed-short", name: "Relaxed Short", color: "Jet Black", price: "4.200.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "belstaff-storm-shell", name: "Belstaff Storm Shell", color: "Washed Blue", price: "3.600.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "belstaff-moto-jacket", name: "Belstaff Moto Jacket", color: "Jet Black", price: "3.600.000 LAK", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "initial-hoodie", name: "Initial Hoodie", color: "Earth", price: "3.600.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
  { slug: "powder-blue-hoodie", name: "Powder Blue Hoodie", color: "Flat White", price: "3.000.000 LAK", colors: 1, image: "/assets/product-black-pants.jpeg", gallery: ["/assets/product-black-pants.jpeg", "/assets/product-red-jacket.jpeg", "/assets/products-grid.png"] },
  { slug: "utility-cargo-pant", name: "Utility Cargo Pant", color: "Jet Black", price: "3.100.000 LAK", colors: 1, image: "/assets/product-red-jacket.jpeg", gallery: ["/assets/product-red-jacket.jpeg", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"] },
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
