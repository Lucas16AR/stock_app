import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE, SITE_URL, UBICACION } from "@/lib/site";
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

const DESCRIPCION = `${SITE_TAGLINE} Catálogo de gorras vintage, selección y marcas en ${UBICACION}. Consultá por WhatsApp.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — Catálogo de gorras`,
  description: DESCRIPCION,
  openGraph: {
    title: `${SITE_NAME} — Catálogo de gorras`,
    description: DESCRIPCION,
    type: "website",
    siteName: SITE_NAME,
    locale: "es_AR",
    images: [{ url: "/brand/logo.png", width: 912, height: 736, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Catálogo de gorras`,
    description: DESCRIPCION,
    images: ["/brand/logo.png"],
  },
};

// Corre antes de pintar la página para evitar el flash del tema
// equivocado (ej: cargar en claro y "saltar" a oscuro un instante
// después). No usa hooks de React a propósito: tiene que ejecutarse
// sincrónicamente antes de la hidratación.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
