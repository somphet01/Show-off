import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlertsPageClient } from "../../components/AlertsPageClient";
import { Header } from "../../components/Header";
import { dictionaries, isLocale, locales, type Locale } from "../../lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AlertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;

  return (
    <div className={`locale-shell locale-${activeLocale}`} lang={activeLocale}>
      <Header dictionary={dictionaries[activeLocale]} locale={activeLocale} tone="clear" />
      <Suspense fallback={null}>
        <AlertsPageClient locale={activeLocale} />
      </Suspense>
    </div>
  );
}
