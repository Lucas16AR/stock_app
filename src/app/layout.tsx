import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gorras Showroom",
  description: "Catálogo de gorras disponibles",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${display.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
