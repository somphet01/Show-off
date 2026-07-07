import { notFound } from "next/navigation";
import { Storefront } from "../components/Storefront";
import { isLocale, locales, type Locale } from "../lib/i18n";
import { getStorefrontProducts } from "../lib/shop-server";
import { getSiteContentSettings } from "../lib/site-content";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [products, siteContent] = await Promise.all([getStorefrontProducts(), getSiteContentSettings()]);

  return (
    <div className={`locale-shell locale-${locale}`} lang={locale}>
      <Storefront covers={siteContent.covers} locale={locale as Locale} products={products} />
    </div>
  );
}
