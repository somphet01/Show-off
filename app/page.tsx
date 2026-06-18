import { Footer as SiteFooter } from "./components/Footer";
import { Header } from "./components/Header";
import { HomeAutoRail } from "./components/HomeAutoRail";
import { QuickAddButton } from "./components/QuickAddButton";
import { SaveProductButton } from "./components/SaveProductButton";
import { TransitionLink } from "./components/TransitionLink";
import { dictionaries, type Dictionary, type Locale } from "./lib/i18n";
import { slugify } from "./lib/shop";
import { redirect } from "next/navigation";

type ColorKey = keyof (typeof dictionaries.en.products.colours);
type ProductRowItem = {
  slug?: string;
  name?: string;
  price: string;
  colorKey?: ColorKey;
  colorName?: string;
  colors?: number;
  swatches?: string[];
  image?: string;
  tone?: string;
  badge?: string;
};

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
    { slug: "represent-x-beach-boys-americas-band-sweater-ice-grey-marl", name: "247 Fused Shorts", price: "\u0e3f78", colorName: "Black", colors: 3, swatches: ["black", "deep-brown", "navy"], image: "/assets/ref-247-shorts.png", badge: "SALE" },
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
      <img src={image} alt={`${title} campaign`} />
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
      <button className="float-dot" type="button" aria-label={`Open ${title}`} />
    </section>
  );
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
    <TransitionLink className="product-card champion-card" href={href} aria-label={`View ${name}`}>
      <div className="product-media">
        <img src={product.image} alt={product.alt} />
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
  const href = `/${locale}/products/${slug}`;
  const colorName = product.colorName ?? (product.colorKey ? dictionary.products.colours[product.colorKey] : "Black");
  const colourCount = product.colors ?? 1;
  const swatches = product.swatches ?? ["black"];
  const displayName = product.name ?? name;

  return (
    <TransitionLink className={`product-card simple-card crop-${(index % 5) + 1}`} href={href} aria-label={`View ${displayName}`}>
      <div className={`product-media ${product.tone ?? ""}`}>
        {product.badge ? <span className={`product-badge is-${product.badge.toLowerCase().replaceAll(" ", "-")}`}>{product.badge}</span> : null}
        <img src={image} alt={displayName} />
        <QuickAddButton item={{ slug, name: displayName, color: colorName, price: product.price, image }} swatches={swatches} />
      </div>
      <div className="product-info">
        <div className="product-title-row">
          <p>{displayName}</p>
          <SaveProductButton item={{ slug, name: displayName, color: colorName, price: product.price, image }} />
        </div>
        <span>{colorName}</span>
        <small>
          {swatches.slice(0, 3).map((swatch, swatchIndex) => (
            <i className={swatch === "black" ? undefined : swatch} key={`${slug}-${swatch}-${swatchIndex}`} />
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
  products: (typeof productRowsBase)[number];
  names: readonly string[];
  dictionary: Dictionary;
  locale: Locale;
  cta: string;
  ctaHref: string;
  direction: "left" | "right";
}) {
  return (
    <section className="rail" id={id} aria-label={`${id} products`}>
      <HomeAutoRail direction={direction}>
        {products.map((product, index) => (
          <SimpleProductCard dictionary={dictionary} index={index} locale={locale} name={names[index]} product={product} key={`${id}-${names[index]}`} />
        ))}
      </HomeAutoRail>
      <TransitionLink className="rail-cta" href={ctaHref}>
        {"->"} {cta}
      </TransitionLink>
    </section>
  );
}

export function Storefront({ locale }: { locale: Locale }) {
  const dictionary = dictionaries[locale];

  return (
    <>
      <Header dictionary={dictionary} locale={locale} />
      <main id="top">
        <Campaign
          className="hero-short"
          image="/assets/cover-main.png"
          label={dictionary.beach.label}
          title={dictionary.beach.title}
          cta={dictionary.campaigns.shopNow}
          href={`/${locale}/collections/jackets`}
        />
        <ProductRail
          dictionary={dictionary}
          id="beach-boys"
          locale={locale}
          names={dictionary.products.rows[0]}
          products={productRowsBase[0]}
          cta={dictionary.products.ctas.beach}
          ctaHref={`/${locale}/collections/t-shirts`}
          direction="right"
        />
        <Campaign
          className="medium campaign-match-hero"
          image="/assets/campaign-dark.png"
          label={dictionary.hero.label}
          title={dictionary.hero.title}
          cta={dictionary.hero.cta}
          href="#champion"
        />
        <ChampionRail dictionary={dictionary} direction="left" locale={locale} />
        <Campaign
          className="tall campaign-match-hero"
          image="/assets/campaign-motel.png"
          label={dictionary.campaigns.summerLabel}
          title={dictionary.campaigns.summer}
          cta={dictionary.campaigns.shopTheDrop}
          href={`/${locale}/collections/t-shirts`}
        />
        <ProductRail
          dictionary={dictionary}
          id="summer"
          locale={locale}
          names={dictionary.products.rows[1]}
          products={productRowsBase[1]}
          cta={dictionary.products.ctas.summer}
          ctaHref={`/${locale}/collections/t-shirts`}
          direction="right"
        />
        <Campaign
          className="medium campaign-match-hero"
          image="/assets/campaign-moto.png"
          label={dictionary.campaigns.belstaffLabel}
          title={dictionary.campaigns.belstaff}
          cta={dictionary.campaigns.shopAccessories}
          href={`/${locale}/collections/accessories`}
        />
        <ProductRail
          dictionary={dictionary}
          id="belstaff"
          locale={locale}
          names={dictionary.products.rows[2]}
          products={productRowsBase[2]}
          cta={dictionary.products.ctas.belstaff}
          ctaHref={`/${locale}/collections/jackets`}
          direction="left"
        />
        <Campaign
          className="tall campaign-match-hero fog"
          image="/assets/campaign-beach.png"
          label={dictionary.campaigns.heatonLabel}
          title={dictionary.campaigns.heavyweight}
          cta={dictionary.campaigns.discoverMore}
          href={`/${locale}/collections/hoodies`}
        />
        <ProductRail
          dictionary={dictionary}
          id="heaton"
          locale={locale}
          names={dictionary.products.rows[0]}
          products={productRowsBase[0]}
          cta={dictionary.products.ctas.heaton}
          ctaHref={`/${locale}/collections/t-shirts`}
          direction="right"
        />
      </main>
      <SiteFooter dictionary={dictionary} locale={locale} />
    </>
  );
}

export default function Home() {
  redirect("/en");
}

