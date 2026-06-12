import { notFound } from "next/navigation";
import { Storefront } from "../page";
import { isLocale, locales, type Locale } from "../lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <div className={`locale-shell locale-${locale}`} lang={locale}>
      <Storefront locale={locale as Locale} />
    </div>
  );
}
