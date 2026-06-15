import { Footer as SiteFooter } from "./components/Footer";
import { Header } from "./components/Header";
import { SaveProductButton } from "./components/SaveProductButton";
import { TransitionLink } from "./components/TransitionLink";
import { dictionaries, type Dictionary, type Locale } from "./lib/i18n";
import { slugify } from "./lib/shop";
import { redirect } from "next/navigation";

type ColorKey = keyof (typeof dictionaries.en.products.colours);
type ProductRowItem = {
  slug?: string;
  price: string;
  colorKey: ColorKey;
  image?: string;
  tone?: string;
};

const championProductsBase = [
  {
    slug: "track-star-jacket",
    price: "6.300.000 LAK",
    colorKey: "jetBlack",
    colors: ["black"],
    image: "/assets/product-red-jacket.jpeg",
    alt: "Black track jacket product",
  },
  {
    slug: "thoroughbred-jersey-washed-black",
    price: "3.600.000 LAK",
    colorKey: "washedBlack",
    colors: ["black", "pink"],
    image: "/assets/product-black-pants.jpeg",
    alt: "Washed black jersey product",
  },
  {
    slug: "thoroughbred-jersey-english-rose",
    price: "3.600.000 LAK",
    colorKey: "englishRose",
    colors: ["pink", "black"],
    image: "/assets/product-red-jacket.jpeg",
    alt: "Pink jersey product",
  },
  {
    slug: "spike-jersey-flat-white",
    price: "3.300.000 LAK",
    colorKey: "flatWhite",
    colors: ["light"],
    image: "/assets/product-black-pants.jpeg",
    alt: "White and red jersey product",
  },
  {
    slug: "star-jersey-jet-black",
    price: "3.300.000 LAK",
    colorKey: "jetBlack",
    colors: ["black"],
    image: "/assets/product-red-jacket.jpeg",
    alt: "Black jersey product",
  },
  {
    slug: "star-long-sleeve-jet-black",
    price: "3.400.000 LAK",
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
    { slug: "beach-boys-americas-band-sweater", price: "1.900.000 LAK", colorKey: "flatWhite", image: "/assets/product-red-jacket.jpeg" },
    { slug: "beach-boys-endless-summer-t-shirt", price: "2.100.000 LAK", colorKey: "washedBlack", image: "/assets/product-black-pants.jpeg" },
    { slug: "beach-boys-tour-t-shirt", price: "2.200.000 LAK", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
    { slug: "beach-boys-cap", price: "1.800.000 LAK", colorKey: "flatWhite", image: "/assets/product-black-pants.jpeg" },
    { slug: "beach-boys-hoodie", price: "2.400.000 LAK", colorKey: "skyBlue", image: "/assets/product-red-jacket.jpeg" },
  ],
  [
    { slug: "summer-graphic-t-shirt", price: "5.700.000 LAK", colorKey: "cobalt", image: "/assets/product-red-jacket.jpeg" },
    { slug: "open-hem-sweatpant", price: "6.800.000 LAK", colorKey: "bone", image: "/assets/product-black-pants.jpeg" },
    { slug: "cowboys-vintage-t-shirt", price: "3.800.000 LAK", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
    { slug: "summer-jersey", price: "3.800.000 LAK", colorKey: "powderBlue", image: "/assets/product-black-pants.jpeg" },
    { slug: "relaxed-short", price: "4.200.000 LAK", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
  ],
  [
    { slug: "belstaff-storm-shell", price: "3.600.000 LAK", colorKey: "washedBlue", image: "/assets/product-red-jacket.jpeg" },
    { slug: "belstaff-moto-jacket", price: "3.600.000 LAK", colorKey: "jetBlack", image: "/assets/product-black-pants.jpeg" },
    { slug: "initial-hoodie", price: "3.600.000 LAK", colorKey: "earth", image: "/assets/product-red-jacket.jpeg" },
    { slug: "powder-blue-hoodie", price: "3.000.000 LAK", colorKey: "flatWhite", image: "/assets/product-black-pants.jpeg" },
    { slug: "utility-cargo-pant", price: "3.100.000 LAK", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
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
      </div>
      <div className="product-info">
        <div className="product-title-row">
          <p>{name}</p>
          <SaveProductButton item={{ slug: product.slug, name, color: colorName, price: product.price, image: product.image }} />
        </div>
        <strong>{product.price}</strong>
      </div>
      <span>{colorName}</span>
      <small>
        {product.colors.map((color, index) => (
          <i className={color === "black" ? undefined : color} key={`${name}-${color}-${index}`} />
        ))}
        {colourCount}
      </small>
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
  const colorName = dictionary.products.colours[product.colorKey];

  return (
    <TransitionLink className={`product-card simple-card crop-${(index % 5) + 1}`} href={href} aria-label={`View ${name}`}>
      <div className={`product-media ${product.tone ?? ""}`}>
        <img src={image} alt={name} />
      </div>
      <div className="product-info">
        <div className="product-title-row">
          <p>{name}</p>
          <SaveProductButton item={{ slug, name, color: colorName, price: product.price, image }} />
        </div>
        <strong>{product.price}</strong>
      </div>
      <span>{colorName}</span>
      <small>
        <i />
        {dictionary.products.oneColour}
      </small>
    </TransitionLink>
  );
}

function ChampionRail({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  return (
    <section className="rail" id="champion" aria-label="Champion collection products">
      <div className="rail-track">
        {championProductsBase.map((product, index) => (
          <ChampionProductCard dictionary={dictionary} index={index} locale={locale} product={product} key={`${product.image}-${index}`} />
        ))}
      </div>
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
}: {
  id: string;
  products: (typeof productRowsBase)[number];
  names: readonly string[];
  dictionary: Dictionary;
  locale: Locale;
  cta: string;
  ctaHref: string;
}) {
  return (
    <section className="rail" id={id} aria-label={`${id} products`}>
      <div className="rail-track rail-light">
        {products.map((product, index) => (
          <SimpleProductCard dictionary={dictionary} index={index} locale={locale} name={names[index]} product={product} key={`${id}-${names[index]}`} />
        ))}
      </div>
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
          href="#beach-boys"
        />
        <ProductRail
          dictionary={dictionary}
          id="beach-boys"
          locale={locale}
          names={dictionary.products.rows[0]}
          products={productRowsBase[0]}
          cta={dictionary.products.ctas.beach}
          ctaHref={`/${locale}/collections/t-shirts`}
        />
        <Campaign
          className="medium"
          image="/assets/campaign-dark.png"
          label={dictionary.hero.label}
          title={dictionary.hero.title}
          cta={dictionary.hero.cta}
          href="#champion"
        />
        <ChampionRail dictionary={dictionary} locale={locale} />
        <Campaign
          className="tall"
          image="/assets/campaign-motel.png"
          title={dictionary.campaigns.summer}
          cta={dictionary.campaigns.shopNow}
          href="#summer"
        />
        <ProductRail
          dictionary={dictionary}
          id="summer"
          locale={locale}
          names={dictionary.products.rows[1]}
          products={productRowsBase[1]}
          cta={dictionary.products.ctas.summer}
          ctaHref={`/${locale}/collections/t-shirts`}
        />
        <Campaign
          className="medium"
          image="/assets/campaign-moto.png"
          label={dictionary.campaigns.belstaffLabel}
          title={dictionary.campaigns.belstaff}
          cta={dictionary.campaigns.shopOuterwear}
          href="#belstaff"
          dark
        />
        <ProductRail
          dictionary={dictionary}
          id="belstaff"
          locale={locale}
          names={dictionary.products.rows[2]}
          products={productRowsBase[2]}
          cta={dictionary.products.ctas.belstaff}
          ctaHref={`/${locale}/collections/jackets`}
        />
        <Campaign
          className="tall fog"
          image="/assets/campaign-beach.png"
          label={dictionary.campaigns.heatonLabel}
          title={dictionary.campaigns.heavyweight}
          countdown={dictionary.beach.countdown}
          cta={dictionary.campaigns.shopNow}
          secondaryCta={dictionary.beach.secondaryCta}
          href="#summer"
        />
        <ProductRail
          dictionary={dictionary}
          id="heaton"
          locale={locale}
          names={dictionary.products.rows[0]}
          products={productRowsBase[0]}
          cta={dictionary.products.ctas.heaton}
          ctaHref={`/${locale}/collections/t-shirts`}
        />
      </main>
      <SiteFooter dictionary={dictionary} locale={locale} />
    </>
  );
}

export default function Home() {
  redirect("/en");
}
