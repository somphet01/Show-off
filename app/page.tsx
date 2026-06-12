import { Header } from "./components/Header";
import { dictionaries, type Dictionary, type Locale } from "./lib/i18n";
import { redirect } from "next/navigation";

type ColorKey = keyof (typeof dictionaries.en.products.colours);

const championProductsBase = [
  {
    price: "$315",
    colorKey: "jetBlack",
    colors: ["black"],
    image: "/assets/product-red-jacket.jpeg",
    alt: "Black track jacket product",
  },
  {
    price: "$180",
    colorKey: "washedBlack",
    colors: ["black", "pink"],
    image: "/assets/product-black-pants.jpeg",
    alt: "Washed black jersey product",
  },
  {
    price: "$180",
    colorKey: "englishRose",
    colors: ["pink", "black"],
    image: "/assets/product-red-jacket.jpeg",
    alt: "Pink jersey product",
  },
  {
    price: "$165",
    colorKey: "flatWhite",
    colors: ["light"],
    image: "/assets/product-black-pants.jpeg",
    alt: "White and red jersey product",
  },
  {
    price: "$165",
    colorKey: "jetBlack",
    colors: ["black"],
    image: "/assets/product-red-jacket.jpeg",
    alt: "Black jersey product",
  },
  {
    price: "$170",
    colorKey: "jetBlack",
    colors: ["black"],
    image: "/assets/product-black-pants.jpeg",
    alt: "Black long sleeve jersey product",
  },
] satisfies Array<{
  price: string;
  colorKey: ColorKey;
  colors: string[];
  image: string;
  alt: string;
}>;

const productRowsBase = [
  [
    { price: "$95", colorKey: "flatWhite", image: "/assets/product-red-jacket.jpeg" },
    { price: "$105", colorKey: "washedBlack", image: "/assets/product-black-pants.jpeg" },
    { price: "$110", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
    { price: "$90", colorKey: "flatWhite", image: "/assets/product-black-pants.jpeg" },
    { price: "$120", colorKey: "skyBlue", image: "/assets/product-red-jacket.jpeg" },
  ],
  [
    { price: "$285", colorKey: "cobalt", image: "/assets/product-red-jacket.jpeg" },
    { price: "$340", colorKey: "bone", image: "/assets/product-black-pants.jpeg" },
    { price: "$190", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
    { price: "$190", colorKey: "powderBlue", image: "/assets/product-black-pants.jpeg" },
    { price: "$210", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
  ],
  [
    { price: "$180", colorKey: "washedBlue", image: "/assets/product-red-jacket.jpeg" },
    { price: "$180", colorKey: "jetBlack", image: "/assets/product-black-pants.jpeg" },
    { price: "$180", colorKey: "earth", image: "/assets/product-red-jacket.jpeg" },
    { price: "$150", colorKey: "flatWhite", image: "/assets/product-black-pants.jpeg" },
    { price: "$155", colorKey: "jetBlack", image: "/assets/product-red-jacket.jpeg" },
  ],
] satisfies Array<
  Array<{
    price: string;
    colorKey: ColorKey;
    image?: string;
  }>
>;

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
  index,
}: {
  product: (typeof championProductsBase)[number];
  dictionary: Dictionary;
  index: number;
}) {
  const name = dictionary.products.champion[index];
  const colourCount = product.colors.length === 1 ? dictionary.products.oneColour : dictionary.products.twoColours;
  const colorName = dictionary.products.colours[product.colorKey];

  return (
    <article className="product-card champion-card">
      <div className="product-media">
        <img src={product.image} alt={product.alt} />
      </div>
      <div className="product-info">
        <p>{name}</p>
        <strong>{product.price}</strong>
      </div>
      <span>{colorName}</span>
      <small>
        {product.colors.map((color, index) => (
          <i className={color === "black" ? undefined : color} key={`${name}-${color}-${index}`} />
        ))}
        {colourCount}
      </small>
    </article>
  );
}

function SimpleProductCard({
  product,
  dictionary,
  name,
  index,
}: {
  product: (typeof productRowsBase)[number][number];
  dictionary: Dictionary;
  name: string;
  index: number;
}) {
  const image = product.image ?? "/assets/products-grid.png";

  return (
    <article className={`product-card simple-card crop-${(index % 5) + 1}`}>
      <div className={`product-media ${product.tone ?? ""}`}>
        <img src={image} alt={name} />
      </div>
      <div className="product-info">
        <p>{name}</p>
        <strong>{product.price}</strong>
      </div>
      <span>{dictionary.products.colours[product.colorKey]}</span>
      <small>
        <i />
        {dictionary.products.oneColour}
      </small>
    </article>
  );
}

function ChampionRail({ dictionary }: { dictionary: Dictionary }) {
  return (
    <section className="rail" id="champion" aria-label="Champion collection products">
      <div className="rail-track">
        {championProductsBase.map((product, index) => (
          <ChampionProductCard dictionary={dictionary} index={index} product={product} key={`${product.image}-${index}`} />
        ))}
      </div>
      <a className="rail-cta" href="#summer">
        {"->"} {dictionary.products.ctas.champion}
      </a>
    </section>
  );
}

function ProductRail({
  id,
  products,
  names,
  dictionary,
  cta,
}: {
  id: string;
  products: (typeof productRowsBase)[number];
  names: readonly string[];
  dictionary: Dictionary;
  cta: string;
}) {
  return (
    <section className="rail" id={id} aria-label={`${id} products`}>
      <div className="rail-track rail-light">
        {products.map((product, index) => (
          <SimpleProductCard dictionary={dictionary} index={index} name={names[index]} product={product} key={`${id}-${names[index]}`} />
        ))}
      </div>
      <a className="rail-cta" href={`#${id}`}>
        {"->"} {cta}
      </a>
    </section>
  );
}

function Footer({ dictionary }: { dictionary: Dictionary }) {
  return (
    <footer className="footer">
      <div>
        <h2>REPRESENT</h2>
        <p>{dictionary.footer.description}</p>
      </div>
      {dictionary.footer.columns.map((column, index) => (
        <nav key={index}>
          {column.map((item) => (
            <a key={item}>{item}</a>
          ))}
        </nav>
      ))}
    </footer>
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
        <ProductRail dictionary={dictionary} id="beach-boys" names={dictionary.products.rows[0]} products={productRowsBase[0]} cta={dictionary.products.ctas.beach} />
        <Campaign
          className="medium"
          image="/assets/campaign-dark.png"
          label={dictionary.hero.label}
          title={dictionary.hero.title}
          cta={dictionary.hero.cta}
          href="#champion"
        />
        <ChampionRail dictionary={dictionary} />
        <Campaign
          className="tall"
          image="/assets/campaign-motel.png"
          title={dictionary.campaigns.summer}
          cta={dictionary.campaigns.shopNow}
          href="#summer"
        />
        <ProductRail dictionary={dictionary} id="summer" names={dictionary.products.rows[1]} products={productRowsBase[1]} cta={dictionary.products.ctas.summer} />
        <Campaign
          className="medium"
          image="/assets/campaign-moto.png"
          label={dictionary.campaigns.belstaffLabel}
          title={dictionary.campaigns.belstaff}
          cta={dictionary.campaigns.shopOuterwear}
          href="#belstaff"
          dark
        />
        <ProductRail dictionary={dictionary} id="belstaff" names={dictionary.products.rows[2]} products={productRowsBase[2]} cta={dictionary.products.ctas.belstaff} />
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
        <ProductRail dictionary={dictionary} id="heaton" names={dictionary.products.rows[0]} products={productRowsBase[0]} cta={dictionary.products.ctas.heaton} />
      </main>
      <Footer dictionary={dictionary} />
    </>
  );
}

export default function Home() {
  redirect("/en");
}
