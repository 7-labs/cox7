import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getLeaguePage } from "@/lib/c7-data";
import { getVideoBySlug } from "@/lib/inventory";

export const alt = "C7 Sports Preview Video";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function VideoOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) {
    notFound();
  }

  const league = getLeaguePage(video.league === "draft" ? "draft" : video.league);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at 20% 10%, rgba(120,255,214,0.28), transparent 36%), radial-gradient(circle at 85% 0%, rgba(140,184,255,0.24), transparent 34%), linear-gradient(135deg, #06070a 0%, #0a0d13 45%, #05060a 100%)",
          color: "#f7f8fb"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#aeb7c7",
              fontSize: "24px"
            }}
          >
            <span style={{ color: "#78ffd6", fontWeight: 800 }}>{video.league.toUpperCase()}</span>
            <span>{video.type.replace(/-/g, " ")}</span>
          </div>
          <div style={{ display: "flex", fontSize: "24px", color: "#aeb7c7" }}>{league?.name || "Sports"} inventory page</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", fontSize: "68px", lineHeight: 0.95, letterSpacing: "-0.07em", fontWeight: 800 }}>
            {video.title}
          </div>
          <div style={{ display: "flex", fontSize: "28px", color: "#aeb7c7", maxWidth: "980px" }}>{video.summary}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "24px", color: "#aeb7c7" }}>
          <div style={{ display: "flex" }}>{video.channelTitle}</div>
          <div style={{ display: "flex" }}>C7 Sports Previews</div>
        </div>
      </div>
    ),
    size
  );
}
