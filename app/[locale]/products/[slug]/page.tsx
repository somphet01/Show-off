import { notFound } from "next/navigation";
import { CollectionView } from "../../../components/CollectionView";
import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { ProductColourGallery } from "../../../components/ProductColourGallery";
import { ProductPurchasePanel } from "../../../components/ProductPurchasePanel";
import { dictionaries, isLocale, locales, type Locale } from "../../../lib/i18n";
import { collectionProducts, productFromSlug } from "../../../lib/shop";

export function generateStaticParams() {
  return locales.flatMap((locale) => collectionProducts.map((product) => ({ locale, slug: product.slug })));
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const product = productFromSlug(slug);

  if (!product) {
    notFound();
  }

  const dictionary = dictionaries[locale as Locale];
  const gallery = product.gallery ?? [product.image, product.image, "/assets/products-grid.png"];
  const detailImages = gallery.length > 1 ? gallery.slice(1, 3) : [product.image];
  const relatedProducts = collectionProducts.filter((item) => item.slug !== product.slug).slice(0, 6);

  return (
    <div className={`locale-shell locale-${locale}`} lang={locale}>
      <Header dictionary={dictionary} locale={locale as Locale} tone="clear" />
      <main className="product-page">
        <div className="product-top">
          <ProductColourGallery baseColour={product.color} colorCount={product.colors} gallery={gallery} productName={product.name} />
          <ProductPurchasePanel product={product} locale={locale} />
        </div>

        <section className="product-story" aria-label={`${product.name} detail images`}>
          <div className="product-section-label">DETAIL</div>
          {detailImages.map((image, index) => (
            <figure className="product-story-frame" key={`${image}-detail-${index}`}>
              <img src={image} alt={`${product.name} material detail ${index + 1}`} />
            </figure>
          ))}
        </section>

        <section className="product-related" aria-labelledby="related-title">
          <div className="product-related-heading">
            <h2 id="related-title">STYLE WITH</h2>
          </div>
          <CollectionView locale={locale} products={relatedProducts} title="Style with" showFilter={false} />
        </section>
      </main>
      <Footer dictionary={dictionary} locale={locale as Locale} />
    </div>
  );
}
