import type { Metadata } from "next";
import { Inter, Noto_Sans_Lao } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import { FloatingContactButton } from "./components/FloatingContactButton";
import { IntroOverlay } from "./components/IntroOverlay";
import { PressMotion } from "./components/PressMotion";
import { ScrollMotion } from "./components/ScrollMotion";
import { ScrollRestorationReset } from "./components/ScrollRestorationReset";
import { getSiteContentSettings, type IntroSettings } from "./lib/site-content";
import "./globals.css";

function createIntroBootScript(intro: IntroSettings) {
  const enabled = JSON.stringify(intro.enabled);
  const showOnce = JSON.stringify(intro.showOncePerVisit);

  return `
(() => {
  const root = document.documentElement;
  const markIntroSessionSeen = () => {
    document.cookie = "show-off-intro-seen-v4=1; path=/; SameSite=Lax";
  };
  const clearIntroBoot = () => {
    root.removeAttribute("data-intro-boot");
    root.removeAttribute("data-intro-ready");
  };

  try {
    const isStorefront = !window.location.pathname.startsWith("/admin");
    const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
    const hasBootedStorefront = window.sessionStorage.getItem("show-off-storefront-booted-v1") === "1";
    const introEnabled = ${enabled};
    const showOncePerVisit = ${showOnce};
    const shouldShowIntro = isStorefront && introEnabled && (
      forceIntro ||
      !showOncePerVisit ||
      (!hasBootedStorefront && window.sessionStorage.getItem("show-off-intro-seen-v4") !== "1")
    );

    if (shouldShowIntro) {
      root.setAttribute("data-intro-boot", "pending");
      root.setAttribute("data-intro-ready", "1");
      window.sessionStorage.setItem("show-off-intro-seen-v4", "1");
      window.sessionStorage.setItem("show-off-storefront-booted-v1", "1");
      markIntroSessionSeen();
    } else {
      if (isStorefront) {
        window.sessionStorage.setItem("show-off-storefront-booted-v1", "1");
      }
      clearIntroBoot();
    }
  } catch {
    clearIntroBoot();
  }
})();
`;
}

const introBootStyle = `
html[data-intro-boot="pending"],
html[data-intro-boot="pending"] body {
  background: #000 !important;
  overflow: hidden !important;
}

html[data-intro-boot="pending"] body > :not(.intro-overlay) {
  visibility: hidden !important;
}

html[data-intro-ready="1"] .intro-overlay {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

.intro-overlay.is-hidden {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  weight: ["400", "500", "600"],
  display: "swap",
});

const notoSansLao = Noto_Sans_Lao({
  subsets: ["lao"],
  variable: "--font-lao",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SHOW OFF",
  description: "SHOW OFF premium streetwear storefront.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { intro } = await getSiteContentSettings();
  const cookieStore = await cookies();
  const hasSeenIntroThisSession = cookieStore.get("show-off-intro-seen-v4")?.value === "1";
  const shouldPrebootIntro = intro.enabled && (!intro.showOncePerVisit || !hasSeenIntroThisSession);
  const introBootAttributes = shouldPrebootIntro
    ? { "data-intro-boot": "pending", "data-intro-ready": "1" }
    : {};

  return (
    <html lang="en" {...introBootAttributes} suppressHydrationWarning>
      <head>
        <Script id="show-off-intro-boot" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: createIntroBootScript(intro) }} />
        <style dangerouslySetInnerHTML={{ __html: introBootStyle }} />
      </head>
      <body className={`${inter.variable} ${notoSansLao.variable}`}>
        <ScrollRestorationReset />
        <IntroOverlay settings={intro} />
        {children}
        <FloatingContactButton />
        <PressMotion />
        <ScrollMotion />
      </body>
    </html>
  );
}
