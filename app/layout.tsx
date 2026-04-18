import type { Metadata } from "next";
import { Inter, DM_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { PRODUCT_SIGNATURE as studioBrand } from "@/lib/brand/manifest";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: studioBrand.metadataTitle,
  description: studioBrand.metadataDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head />
      <body
        className={`${inter.variable} ${dmSans.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
