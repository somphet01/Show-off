import { notFound, redirect } from "next/navigation";
import { CollectionView } from "../../../components/CollectionView";
import { Footer } from "../../../components/Footer";
import { Header } from "../../../components/Header";
import { ProductColourGallery } from "../../../components/ProductColourGallery";
import { ProductPurchasePanel } from "../../../components/ProductPurchasePanel";
import { dictionaries, isLocale, locales, type Locale } from "../../../lib/i18n";
import { collectionProducts } from "../../../lib/shop";
import { getStorefrontProductFromSlug, getStorefrontProducts } from "../../../lib/shop-server";

export function generateStaticParams() {
  return locales.flatMap((locale) => collectionProducts.map((product) => ({ locale, slug: product.slug })));
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Promise<{ colour?: string | string[]; color?: string | string[] }>;
}) {
  const { locale, slug } = await params;
  const query = searchParams ? await searchParams : {};

  if (!isLocale(locale)) {
    notFound();
  }

  const product = await getStorefrontProductFromSlug(slug);

  if (!product) {
    redirect(`/${locale}`);
  }

  const dictionary = dictionaries[locale as Locale];
  const queryColour = query.colour ?? query.color;
  const requestedColour = Array.isArray(queryColour) ? queryColour[0] : queryColour;
  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const detailImages = product.detailImages !== undefined ? product.detailImages : gallery.length > 1 ? gallery.slice(1, 3) : [product.image];
  const storefrontProducts = await getStorefrontProducts();
  const relatedProducts = storefrontProducts.filter((item) => item.slug !== product.slug).slice(0, 6);

  return (
    <div className={`locale-shell locale-${locale}`} lang={locale}>
      <Header dictionary={dictionary} locale={locale as Locale} tone="clear" />
      <main className="product-page">
        <div className="product-top">
          <ProductColourGallery baseColour={product.color} colorCount={product.colors} gallery={gallery} productName={product.name} colourImages={product.colourImages} initialColour={requestedColour} />
          <ProductPurchasePanel product={product} locale={locale} initialColour={requestedColour} />
        </div>

        {detailImages.length > 0 ? (
          <section className="product-story" aria-label={`${product.name} detail images`}>
            <div className="product-section-label">DETAIL</div>
            {detailImages.map((image, index) => (
              <figure className="product-story-frame" key={`${image}-detail-${index}`}>
                <img src={image} alt={`${product.name} material detail ${index + 1}`} />
              </figure>
            ))}
          </section>
        ) : null}

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
