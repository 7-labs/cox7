import type { Metadata } from "next";
import LeagueLanding from "@/components/LeagueLanding";

export const metadata: Metadata = {
  title: "Soccer Match Previews",
  description:
    "Find soccer match previews, Champions League previews, Premier League matchweek previews, World Cup previews, and trusted football preview videos from YouTube.",
  alternates: {
    canonical: "/soccer-previews/"
  }
};

export default function SoccerPreviewsPage() {
  return <LeagueLanding slug="soccer" />;
}
