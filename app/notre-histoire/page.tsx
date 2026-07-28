import type { Metadata } from "next";
import OurStoryPage from "@/components/landing/OurStoryPage";

export const metadata: Metadata = {
  title: "Notre histoire | Obillz",
  description:
    "L’histoire derrière Obillz — né sur le terrain, au contact des clubs, des comités et des bénévoles.",
};

export default function NotreHistoireRoute() {
  return <OurStoryPage />;
}
