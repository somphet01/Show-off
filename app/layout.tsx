import type { Metadata } from "next";
import { Inter, Noto_Sans_Lao } from "next/font/google";
import { PressMotion } from "./components/PressMotion";
import { ScrollMotion } from "./components/ScrollMotion";
import { ScrollRestorationReset } from "./components/ScrollRestorationReset";
import "./globals.css";

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
  title: "REPRESENT Storefront",
  description: "Luxury fashion ecommerce storefront built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSansLao.variable}`}>
        <ScrollRestorationReset />
        {children}
        <PressMotion />
        <ScrollMotion />
      </body>
    </html>
  );
}
