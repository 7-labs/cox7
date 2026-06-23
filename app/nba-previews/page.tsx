import type { Metadata } from "next";
import LeagueLanding from "@/components/LeagueLanding";

export const metadata: Metadata = {
  title: "NBA Game and Draft Previews",
  description:
    "Find NBA preview videos, NBA Draft previews, Finals previews, and trusted YouTube pregame analysis from official channels.",
  alternates: {
    canonical: "/nba-previews/"
  }
};

export default function NbaPreviewsPage() {
  return <LeagueLanding slug="nba" />;
}
