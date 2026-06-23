import type { Metadata } from "next";
import LeagueLanding from "@/components/LeagueLanding";

export const metadata: Metadata = {
  title: "Sports Draft Preview Videos",
  description:
    "Find NBA Draft, NFL Draft, MLB Draft, prospect, and team-fit preview videos from official and trusted YouTube sports channels.",
  alternates: {
    canonical: "/draft-previews/"
  }
};

export default function DraftPreviewsPage() {
  return <LeagueLanding slug="draft" />;
}
