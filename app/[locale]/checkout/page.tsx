import { notFound } from "next/navigation";
import { CheckoutClient } from "../../components/CheckoutClient";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { dictionaries, isLocale, locales, type Locale } from "../../lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = dictionaries[locale as Locale];

  return (
    <div className={`locale-shell locale-${locale}`} lang={locale}>
      <Header dictionary={dictionary} locale={locale as Locale} tone="clear" />
      <CheckoutClient locale={locale as Locale} />
      <Footer dictionary={dictionary} locale={locale as Locale} />
    </div>
  );
}
