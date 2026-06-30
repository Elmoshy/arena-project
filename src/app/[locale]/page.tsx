import { setRequestLocale } from "next-intl/server";
import Hero from "@/components/sections/Hero";
import GamesShowcase from "@/components/sections/GamesShowcase";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Stats from "@/components/sections/Stats";
import FAQ from "@/components/sections/FAQ";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <GamesShowcase />
      <Features />
      <HowItWorks />
      <Stats />
      <FAQ />
    </>
  );
}
