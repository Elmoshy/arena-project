import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "../globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Hero" });
  const title = "Arena — Challenge Friends. Master Games. Play Anywhere.";
  const description = t("description");

  return {
    metadataBase: new URL("https://arena.games"),
    title: {
      default: title,
      template: "%s · Arena",
    },
    description,
    alternates: {
      languages: { en: "/en", ar: "/ar" },
    },
    openGraph: {
      title,
      description,
      siteName: "Arena",
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${syne.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-text antialiased">
        <NextIntlClientProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
