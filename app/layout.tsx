import type { Metadata } from "next";
import { Noto_Sans_Lao, Roboto_Condensed } from "next/font/google";
import "./globals.css";

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  variable: "--font-latin",
  weight: ["400", "500", "600", "700"],
});

const notoSansLao = Noto_Sans_Lao({
  subsets: ["lao"],
  variable: "--font-lao",
  weight: ["400", "500", "600", "700"],
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
      <body className={`${robotoCondensed.variable} ${notoSansLao.variable}`}>{children}</body>
    </html>
  );
}
