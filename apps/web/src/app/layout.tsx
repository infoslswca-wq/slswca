import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import { site } from "@slswca/core/content";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Motion } from "@/components/Motion";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const archivo = Archivo({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-archivo", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://slswca.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.fullName, locale: "en_LK" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#131210", colorScheme: "dark" };

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  name: site.fullName,
  alternateName: site.name,
  url: siteUrl,
  logo: `${siteUrl}/logo-light.png`,
  foundingDate: String(site.founded),
  sport: "Calisthenics",
  address: { "@type": "PostalAddress", addressLocality: site.city, addressCountry: "LK" },
  memberOf: { "@type": "SportsOrganization", name: "World Street Workout & Calisthenics Federation" },
  sameAs: [site.social.instagram],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only z-100 bg-gold px-4 py-3 font-bold text-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
          Skip to content
        </a>
        <SiteNav />
        <main id="main">{children}</main>
        <SiteFooter />
        <Motion />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}
