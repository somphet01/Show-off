import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Noto_Sans_Lao } from "next/font/google";
import { FloatingContactButton } from "./components/FloatingContactButton";
import { IntroOverlay } from "./components/IntroOverlay";
import { PressMotion } from "./components/PressMotion";
import { ScrollMotion } from "./components/ScrollMotion";
import { ScrollRestorationReset } from "./components/ScrollRestorationReset";
import "./globals.css";

const introBootScript = `
(() => {
  try {
    const isStorefront = !window.location.pathname.startsWith("/admin");
    const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
    const shouldShowIntro = isStorefront && (forceIntro || window.sessionStorage.getItem("show-off-intro-seen-v4") !== "1");
    if (shouldShowIntro) {
      document.documentElement.classList.add("intro-boot-pending");
    } else {
      document.documentElement.classList.remove("intro-boot-pending");
    }
  } catch {
    document.documentElement.classList.add("intro-boot-pending");
  }
})();
`;

const introCriticalStyle = `
html.intro-boot-pending,
html.intro-boot-pending body {
  overflow: hidden !important;
  background: #000 !important;
}

html.intro-boot-pending body > * {
  visibility: hidden !important;
}

html.intro-boot-pending .intro-overlay,
html.intro-boot-pending .intro-overlay * {
  visibility: visible !important;
}

.intro-overlay.is-boot-overlay {
  visibility: hidden !important;
}

html.intro-boot-pending .intro-overlay.is-boot-overlay {
  visibility: visible !important;
}

html.intro-boot-pending body::before {
  position: fixed;
  inset: 0;
  z-index: 2147482999;
  display: block;
  content: "";
  background: #000;
  pointer-events: none;
  visibility: visible !important;
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="intro-boot-pending" suppressHydrationWarning>
      <head>
        <Script id="intro-boot" strategy="beforeInteractive">
          {introBootScript}
        </Script>
        <style dangerouslySetInnerHTML={{ __html: introCriticalStyle }} />
      </head>
      <body className={`${inter.variable} ${notoSansLao.variable}`}>
        <style dangerouslySetInnerHTML={{ __html: introCriticalStyle }} />
        <ScrollRestorationReset />
        <IntroOverlay />
        {children}
        <FloatingContactButton />
        <PressMotion />
        <ScrollMotion />
      </body>
    </html>
  );
}
