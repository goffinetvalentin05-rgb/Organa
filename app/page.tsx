import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { defaultLocale, getTranslation } from "@/lib/i18n";

export const metadata: Metadata = {
  title: getTranslation(defaultLocale, "landing.metadata.title"),
  description: getTranslation(defaultLocale, "landing.metadata.description"),
};

export default function Home() {
  return <LandingPage />;
}
