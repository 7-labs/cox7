import type { Metadata } from "next";
import LeagueLanding from "@/components/LeagueLanding";

export const metadata: Metadata = {
  title: "MLB Season and Game Previews",
  description:
    "Find MLB season previews, game previews, postseason previews, and trusted baseball preview videos from YouTube.",
  alternates: {
    canonical: "/mlb-previews/"
  }
};

export default function MlbPreviewsPage() {
  return <LeagueLanding slug="mlb" />;
}
