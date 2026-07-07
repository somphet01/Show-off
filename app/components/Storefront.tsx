import type { CSSProperties } from "react";
import { Footer as SiteFooter } from "./Footer";
import { Header } from "./Header";
import { HomeAutoRail } from "./HomeAutoRail";
import { HomeProductCardImage } from "./HomeProductCardImage";
import { QuickAddButton } from "./QuickAddButton";
import { SaveProductButton } from "./SaveProductButton";
import { TransitionLink } from "./TransitionLink";
import { dictionaries, type Dictionary, type Locale } from "../lib/i18n";
import { productsForCollectionSlug, slugify, type CollectionProduct } from "../lib/shop";
import { defaultHomeCovers, type HomeCoverSlot, type SiteMediaType } from "../lib/site-content-types";

type ColorKey = keyof (typeof dictionaries.en.products.colours);
type ProductRowItem = {
  slug?: string;
  name?: string;
  category?: string;
  price: string;
  colorKey?: ColorKey;
  color?: string;
  colorName?: string;
  colors?: number;
  swatches?: string[];
  swatchHexes?: string[];
  swatchLabels?: string[];
  cardImages?: Record<string, string[]>;
  colourImages?: Record<string, string[]>;
  variantSizes?: Record<string, string[]>;
  variantStockByColor?: Record<string, Record<string, number>>;
  image?: string;
  tone?: string;
  badge?: string;
};

function usesCoverMaster(image: string) {
  const source = image.toLowerCase();
  return source.includes("-card.") || source.includes("real-retro-") || source.includes("/product-images/") || source.includes("product-images") || source.includes("so_product=") || source.includes("supabase");
}

function inStockVariantSizes(product: Pick<CollectionProduct, "variantSizes" | "variantStockByColor">) {
  if (!product.variantStockByColor) {
    return product.variantSizes;
  }

  return Object.fromEntries(
    Object.entries(product.variantStockByColor).map(([colour, stockBySize]) => [
      colour,
      Object.entries(stockBySize)
        .filter(([, stock]) => stock > 0)
        .map(([size]) => size),
    ]),
  );
}

function swatchStyle(hex?: string) {
  return hex ? ({ "--swatch-color": hex } as CSSProperties) : undefined;
}

function swatchClassName(swatch: string, hex?: string) {
  return hex ? `${swatch} has-custom-swatch` : swatch;
}

function imagesForColour(colourImages: Record<string, string[]> | undefined, colour: string) {
  if (!colourImages) {
    return [];
  }

  const directMatch = colourImages[colour];
  if (directMatch) {
    return directMatch.filter(Boolean);
  }

  const normalizedColour = colour.toLowerCase();
  const matchedKey = Object.keys(colourImages).find((key) => key.toLowerCase() === normalizedColour);
  return matchedKey ? colourImages[matchedKey].filter(Boolean) : [];
}

function cardImageForColour(image: string, colour: string, colourImages?: Record<string, string[]>) {
  return cardImagesForColour(image, colour, colourImages)[0] ?? image;
}

function cardImagesForColour(image: string, colour: string, colourImages?: Record<string, string[]>) {
  const colourGallery = imagesForColour(colourImages, colour);
  const cardMasterImages = colourGallery.filter((source) => {
    const normalizedSource = source.toLowerCase();
    return normalizedSource.includes("-card.") || normalizedSource.includes("-front.");
  });

  if (cardMasterImages.length > 0) {
    return cardMasterImages;
  }

  const cardReadyImages = colourGallery.filter((source) => {
    const normalizedSource = source.toLowerCase();
    return !normalizedSource.includes("model") && !normalizedSource.includes("detail") && !normalizedSource.includes("gallery");
  });

  if (cardReadyImages.length > 0) {
    return cardReadyImages;
  }

  return [colourGallery[0] ?? image];
}

function homeSlideshowImagesForColour(image: string, colour: string, cardImages?: Record<string, string[]>, colourImages?: Record<string, string[]>) {
  const primaryCardImages = cardImagesForColour(image, colour, cardImages ?? colourImages);
  const colourGallery = imagesForColour(colourImages, colour);
  const extraImages = colourGallery.filter((source) => {
    const normalizedSource = source.toLowerCase();
    return !normalizedSource.includes("detail") && !normalizedSource.includes("gallery");
  });

  return Array.from(new Set([...primaryCardImages, ...extraImages])).slice(0, 2);
}

function productHref(locale: Locale | string, slug: string, colour: string) {
  return `/${locale}/products/${slug}?colour=${encodeURIComponent(colour)}`;
}

function uniqueProductsBySlug<T extends { slug?: string; name?: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item, index) => {
    const key = (item.name ? `name:${item.name}` : item.slug ? `slug:${item.slug}` : `product-${index}`).toLowerCase().trim();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function homeProductsForCollection(slug: string, sourceProducts: CollectionProduct[]) {
  if (!sourceProducts.length) {
    return [];
  }

  const categoryMatches = sourceProducts.filter((product) => product.category && slugify(product.category) === slug);

  if (categoryMatches.length > 0) {
    return uniqueProductsBySlug(categoryMatches).slice(0, 5);
  }

  const keywordMatches = productsForCollectionSlug(slug, sourceProducts);

  return uniqueProductsBySlug(keywordMatches).slice(0, 5);
}

function ProductRailEmptyState() {
  return (
    <div className="rail-empty-state" role="status">
      <p>No products yet</p>
    </div>
  );
}

const championProductsBase = [
  {
    slug: "track-star-jacket",
    price: "฿6,300",
    colorKey: "jetBlack",
    colors: ["black"],
    image: "/assets/product-red-jacket.jpeg",
    alt: "Black track jacket product",
  },
  {
    slug: "thoroughbred-jersey-washed-black",
    price: "฿3,600",
    colorKey: "washedBlack",
    colors: ["black", "pink"],
    image: "/assets/product-black-pants.jpeg",
    alt: "Washed black jersey product",
  },
  {
    slug: "thoroughbred-jersey-english-rose",
    price: "฿3,600",
    colorKey: "englishRose",
    colors: ["pink", "black"],
    image: "/assets/product-red-jacket.jpeg",
    alt: "Pink jersey product",
  },
  {
    slug: "spike-jersey-flat-white",
    price: "฿3,300",
    colorKey: "flatWhite",
    colors: ["light"],
    image: "/assets/product-black-pants.jpeg",
    alt: "White and red jersey product",
  },
  {
    slug: "star-jersey-jet-black",
    price: "฿3,300",
    colorKey: "jetBlack",
    colors: ["black"],
    image: "/assets/product-red-jacket.jpeg",
    alt: "Black jersey product",
  },
  {
    slug: "star-long-sleeve-jet-black",
    price: "฿3,400",
    colorKey: "jetBlack",
    colors: ["black"],
    image: "/assets/product-black-pants.jpeg",
    alt: "Black long sleeve jersey product",
  },
] satisfies Array<{
  slug: string;
  price: string;
  colorKey: ColorKey;
  colors: string[];
  image: string;
  alt: string;
}>;

const productRowsBase: ProductRowItem[][] = [
  [
    {
      slug: "retro-patchwork-striped-color-block-short",
      name: "Retro Patchwork Striped Color Block Short",
      price: "\u0e3f1,300",
      colorName: "Red",
      colors: 2,
      swatches: ["red", "black"],
      cardImages: {
        Red: ["/assets/real-retro-red-front.jpg"],
        Black: ["/assets/real-retro-black-front.jpg"],
      },
      colourImages: {
        Red: ["/assets/real-retro-red-front.jpg", "/assets/real-retro-red-model.jpg"],
        Black: ["/assets/real-retro-black-front.jpg", "/assets/real-retro-black-model.jpg"],
      },
      variantSizes: { Red: ["L", "XL", "XXL"], Black: ["M", "L", "XL"] },
      image: "/assets/real-retro-red-front.jpg",
      badge: "SALE",
    },
    { slug: "pegasus-zip-through-hoodie-indigo", name: "Team 247 Oversized T-Shirt", price: "\u0e3f60", colorName: "Black", colors: 6, swatches: ["black", "black", "white", "cream", "grey"], image: "/assets/ref-247-black-tee.png", badge: "SALE" },
    { slug: "british-cowboys-hoodie-stained-black", name: "247 Oversized Tank", price: "\u0e3f59", colorName: "Jet Black", colors: 2, swatches: ["black", "white"], image: "/assets/ref-247-black-tank.png", badge: "SALE" },
    { slug: "owners-club-hoodie-washed-black", name: "Team 247 Oversized T-Shirt", price: "\u0e3f63", colorName: "Jet Black", colors: 6, swatches: ["black", "white", "black", "cream", "grey"], image: "/assets/ref-247-black-tee-2.png", badge: "Restocked" },
    { slug: "atlas-graphic-hoodie-flat-white", name: "247 Oversized T-Shirt", price: "\u0e3f61", colorName: "Flat White", colors: 6, swatches: ["white", "black", "white", "black", "deep-brown"], image: "/assets/ref-247-white-tee.png", badge: "SALE" },
  ],
  [
    { slug: "summer-graphic-t-shirt", price: "฿5,700", colorKey: "cobalt", image: "/assets/product-red-jacket.jpeg" },
    { slug: "open-hem-sweatpant", price: "฿6,800", colorKey: "bone", image: "/assets/product-black-pants.jpeg" },
    { slug: "cowboys-vintage-t-shirt", price: "฿3,800", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
    { slug: "summer-jersey", price: "฿3,800", colorKey: "powderBlue", image: "/assets/product-black-pants.jpeg" },
    { slug: "relaxed-short", price: "฿4,200", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
  ],
  [
    { slug: "belstaff-storm-shell", price: "฿3,600", colorKey: "washedBlue", image: "/assets/product-red-jacket.jpeg" },
    { slug: "belstaff-moto-jacket", price: "฿3,600", colorKey: "jetBlack", image: "/assets/product-black-pants.jpeg" },
    { slug: "initial-hoodie", price: "฿3,600", colorKey: "earth", image: "/assets/product-red-jacket.jpeg" },
    { slug: "powder-blue-hoodie", price: "฿3,000", colorKey: "flatWhite", image: "/assets/product-black-pants.jpeg" },
    { slug: "utility-cargo-pant", price: "฿3,100", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
  ],
];

function Campaign({
  image,
  mediaType = "image",
  title,
  label,
  cta,
  href,
  className = "medium",
  dark = false,
  countdown,
  secondaryCta,
}: {
  image: string;
  mediaType?: SiteMediaType;
  title: string;
  label?: string;
  cta: string;
  href: string;
  className?: string;
  dark?: boolean;
  countdown?: string;
  secondaryCta?: string;
}) {
  return (
    <section className={`campaign ${className}`}>
      {mediaType === "video" ? (
        <video autoPlay loop muted playsInline preload="metadata" src={image} />
      ) : (
        <img src={image} alt={`${title} campaign`} />
      )}
      <div className={`campaign-copy${dark ? " dark-copy" : ""}`}>
        {label ? <span>{label}</span> : null}
        <h2>{title}</h2>
        {countdown ? <strong className="countdown">{countdown}</strong> : null}
        {secondaryCta ? (
          <div className="button-row">
            <a href={href}>{cta}</a>
            <a href="#lookbook">{secondaryCta}</a>
          </div>
        ) : (
          <a href={href}>{cta}</a>
        )}
      </div>
    </section>
  );
}

function localizeCoverHref(locale: Locale, href: string) {
  const cleanHref = href.trim();

  if (!cleanHref || cleanHref.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(cleanHref)) {
    return cleanHref || `/${locale}`;
  }

  if (cleanHref === `/${locale}` || cleanHref.startsWith(`/${locale}/`)) {
    return cleanHref;
  }

  return cleanHref.startsWith("/") ? `/${locale}${cleanHref}` : `/${locale}/${cleanHref}`;
}

function ChampionProductCard({
  product,
  dictionary,
  locale,
  index,
}: {
  product: (typeof championProductsBase)[number];
  dictionary: Dictionary;
  locale: Locale;
  index: number;
}) {
  const name = dictionary.products.champion[index];
  const colourCount = product.colors.length === 1 ? dictionary.products.oneColour : dictionary.products.twoColours;
  const colorName = dictionary.products.colours[product.colorKey];
  const href = `/${locale}/products/${product.slug}`;

  return (
    <TransitionLink className="product-card champion-card" href={href} aria-label={`View ${name}`} draggable={false}>
      <div className="product-media">
        <img src={product.image} alt={product.alt} draggable={false} />
        <QuickAddButton item={{ slug: product.slug, name, color: colorName, price: product.price, image: product.image }} swatches={product.colors} />
      </div>
      <div className="product-info">
        <div className="product-title-row">
          <p>{name}</p>
          <SaveProductButton item={{ slug: product.slug, name, color: colorName, price: product.price, image: product.image }} />
        </div>
        <span>{colorName}</span>
        <small>
          {product.colors.map((color, index) => (
            <i className={color === "black" ? undefined : color} key={`${name}-${color}-${index}`} />
          ))}
          {colourCount}
        </small>
        <strong>{product.price}</strong>
      </div>
    </TransitionLink>
  );
}

function SimpleProductCard({
  product,
  dictionary,
  locale,
  name,
  index,
}: {
  product: (typeof productRowsBase)[number][number];
  dictionary: Dictionary;
  locale: Locale;
  name: string;
  index: number;
}) {
  const image = product.image ?? "/assets/products-grid.png";
  const slug = product.slug ?? slugify(name);
  const colorName = product.colorName ?? product.color ?? (product.colorKey ? dictionary.products.colours[product.colorKey] : "Black");
  const href = productHref(locale, slug, colorName);
  const colourCount = product.colors ?? 1;
  const swatches = product.swatches ?? ["black"];
  const displayName = product.name ?? name;
  const imageByColor = product.colourImages
    ? Object.fromEntries(Object.keys(product.colourImages).map((colour) => [colour, cardImageForColour(image, colour, product.colourImages)]))
    : undefined;
  const cardImage = cardImageForColour(image, colorName, product.cardImages ?? product.colourImages);
  const isCoverMaster = usesCoverMaster(cardImage);
  const cardDisplayImages = homeSlideshowImagesForColour(image, colorName, product.cardImages, product.colourImages);

  return (
    <TransitionLink className={`product-card simple-card crop-${(index % 5) + 1}`} href={href} aria-label={`View ${displayName}`} draggable={false}>
      <div className={`product-media ${product.tone ?? ""}${isCoverMaster ? " is-cover-master" : ""}`}>
        {product.badge ? <span className={`product-badge is-${product.badge.toLowerCase().replaceAll(" ", "-")}`}>{product.badge}</span> : null}
        <HomeProductCardImage images={cardDisplayImages} alt={displayName} />
        <QuickAddButton item={{ slug, name: displayName, color: colorName, price: product.price, image: cardImage }} swatches={swatches} swatchHexes={product.swatchHexes} swatchLabels={product.swatchLabels} sizeOptionsByColor={product.variantSizes} variantStockByColor={product.variantStockByColor} imageByColor={imageByColor} />
      </div>
      <div className="product-info">
        <div className="product-title-row">
          <p>{displayName}</p>
          <SaveProductButton item={{ slug, name: displayName, color: colorName, price: product.price, image: cardImage }} />
        </div>
        <span>{colorName}</span>
        <small>
          {swatches.slice(0, 3).map((swatch, swatchIndex) => (
            <i className={swatchClassName(swatch, product.swatchHexes?.[swatchIndex])} style={swatchStyle(product.swatchHexes?.[swatchIndex])} key={`${slug}-${swatch}-${swatchIndex}`} />
          ))}
          <span className="colour-count-text">{colourCount > 3 ? `+${colourCount} Colours` : colourCount === 1 ? dictionary.products.oneColour : `${colourCount} Colours`}</span>
        </small>
        <em>
          <span>{product.price}</span>
        </em>
      </div>
    </TransitionLink>
  );
}

function ChampionRail({ dictionary, locale, direction }: { dictionary: Dictionary; locale: Locale; direction: "left" | "right" }) {
  return (
    <section className="rail" id="champion" aria-label="Champion collection products">
      <HomeAutoRail direction={direction}>
        {championProductsBase.map((product, index) => (
          <ChampionProductCard dictionary={dictionary} index={index} locale={locale} product={product} key={`${product.image}-${index}`} />
        ))}
      </HomeAutoRail>
      <TransitionLink className="rail-cta" href={`/${locale}/collections/clothing`}>
        {"->"} {dictionary.products.ctas.champion}
      </TransitionLink>
    </section>
  );
}

function ProductRail({
  id,
  products,
  names,
  dictionary,
  locale,
  cta,
  ctaHref,
  direction,
}: {
  id: string;
  products: ProductRowItem[];
  names: readonly string[];
  dictionary: Dictionary;
  locale: Locale;
  cta: string;
  ctaHref: string;
  direction: "left" | "right";
}) {
  return (
    <section className="rail" id={id} aria-label={`${id} products`}>
      {products.length > 0 ? (
        <HomeAutoRail direction={direction}>
          {products.map((product, index) => (
            <SimpleProductCard dictionary={dictionary} index={index} locale={locale} name={names[index]} product={product} key={`${id}-${product.slug ?? names[index]}`} />
          ))}
        </HomeAutoRail>
      ) : (
        <ProductRailEmptyState />
      )}
      <TransitionLink className="rail-cta" href={ctaHref}>
        {"->"} {cta}
      </TransitionLink>
    </section>
  );
}

export function Storefront({
  locale,
  products = [],
  covers = defaultHomeCovers,
}: {
  locale: Locale;
  products?: CollectionProduct[];
  covers?: HomeCoverSlot[];
}) {
  const dictionary = dictionaries[locale];
  const sectionProducts = {
    jackets: homeProductsForCollection("jackets", products),
    jeans: homeProductsForCollection("baggy-jeans", products),
    tees: homeProductsForCollection("t-shirts", products),
    accessories: homeProductsForCollection("accessories", products),
    hoodies: homeProductsForCollection("hoodies", products),
  };
  const sectionNames = (row: ProductRowItem[], fallbackRowIndex: number) =>
    row.map((product, productIndex) => product.name ?? dictionary.products.rows[fallbackRowIndex]?.[productIndex] ?? "SHOW OFF product");
  const slots = defaultHomeCovers.map((fallback, index) => covers[index] ?? fallback);
  const sections = [
    {
      slot: slots[0],
      className: "hero-short",
      id: "jackets",
      products: sectionProducts.jackets,
      fallbackRowIndex: 0,
      direction: "right" as const,
    },
    {
      slot: slots[1],
      className: "medium campaign-match-hero",
      id: "baggy-jeans",
      products: sectionProducts.jeans,
      fallbackRowIndex: 1,
      direction: "left" as const,
    },
    {
      slot: slots[2],
      className: "tall campaign-match-hero",
      id: "summer",
      products: sectionProducts.tees,
      fallbackRowIndex: 1,
      direction: "right" as const,
    },
    {
      slot: slots[3],
      className: "medium campaign-match-hero",
      id: "accessories",
      products: sectionProducts.accessories,
      fallbackRowIndex: 2,
      direction: "left" as const,
    },
    {
      slot: slots[4],
      className: "tall campaign-match-hero fog",
      id: "hoodies",
      products: sectionProducts.hoodies,
      fallbackRowIndex: 2,
      direction: "right" as const,
    },
  ];

  return (
    <>
      <Header dictionary={dictionary} locale={locale} />
      <main id="top">
        {sections.map(({ slot, className, id, products: railProducts, fallbackRowIndex, direction }) =>
          slot.enabled ? (
            <div className="home-content-section" key={slot.id}>
              <Campaign
                className={className}
                image={slot.asset}
                mediaType={slot.mediaType}
                label={slot.label}
                title={slot.title}
                cta={slot.cta}
                href={localizeCoverHref(locale, slot.link)}
              />
              <ProductRail
                dictionary={dictionary}
                id={id}
                locale={locale}
                names={sectionNames(railProducts, fallbackRowIndex)}
                products={railProducts}
                cta={slot.cta}
                ctaHref={localizeCoverHref(locale, slot.link)}
                direction={direction}
              />
            </div>
          ) : null,
        )}
      </main>
      <SiteFooter dictionary={dictionary} locale={locale} />
    </>
  );
}


