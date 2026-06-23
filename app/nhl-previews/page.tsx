import type { Metadata } from "next";
import LeagueLanding from "@/components/LeagueLanding";

export const metadata: Metadata = {
  title: "NHL Playoff and Game Previews",
  description:
    "Find NHL playoff previews, Stanley Cup preview videos, official trailers, and trusted hockey preview clips from YouTube.",
  alternates: {
    canonical: "/nhl-previews/"
  }
};

export default function NhlPreviewsPage() {
  return <LeagueLanding slug="nhl" />;
}
