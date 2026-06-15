import { notFound } from "next/navigation";
import { CollectionView } from "../../../components/CollectionView";
import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { dictionaries, isLocale, locales, type Locale } from "../../../lib/i18n";
import { collectionProducts, shopCategories, slugify, titleFromSlug } from "../../../lib/shop";

export function generateStaticParams() {
  const slugs = [shopCategories.map((category) => category.title), shopCategories.flatMap((category) => category.items)].flat().map(slugify);

  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

function collectionTitle(slug: string) {
  if (slug === "hoodies") {
    return "Streetwear Hoodies & Graphic Hoodies";
  }

  return `${titleFromSlug(slug)} Collection`;
}

function collectionDescription(slug: string) {
  if (slug === "hoodies") {
    return "Explore our range of premium hoodies. Styled for streetwear, daily rotation, and late-night layers.";
  }

  return `Explore ${titleFromSlug(slug).toLowerCase()} selected for the current REPRESENT edit.`;
}

export default async function CollectionPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = dictionaries[locale as Locale];
  const title = collectionTitle(slug);
  const description = collectionDescription(slug);

  return (
    <div className={`locale-shell locale-${locale}`} lang={locale}>
      <Header dictionary={dictionary} locale={locale as Locale} tone="clear" />
      <main className="collection-page">
        <section className="collection-hero" aria-labelledby="collection-title">
          <h1 id="collection-title">
            {title}
            <sup>161</sup>
          </h1>
          <p>
            {description} <a href="#collection-grid">read more</a>
          </p>
        </section>

        <CollectionView locale={locale} products={collectionProducts} title={title} />
      </main>
      <Footer dictionary={dictionary} locale={locale as Locale} />
    </div>
  );
}
