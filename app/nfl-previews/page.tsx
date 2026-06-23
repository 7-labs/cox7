import type { Metadata } from "next";
import LeagueLanding from "@/components/LeagueLanding";

export const metadata: Metadata = {
  title: "NFL Game Previews",
  description:
    "Find official NFL game previews, playoff previews, conference championship previews, and trusted YouTube matchup videos.",
  alternates: {
    canonical: "/nfl-previews/"
  }
};

export default function NflPreviewsPage() {
  return <LeagueLanding slug="nfl" />;
}
