import { ImageResponse } from "next/og";

export const alt = "C7 Sports Previews";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              border: "1px solid rgba(120,255,214,0.45)",
              background: "linear-gradient(135deg, rgba(120,255,214,0.22), rgba(140,184,255,0.14))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: 800
            }}
          >
            C7
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: "22px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#78ffd6"
              }}
            >
              Official Sports Preview Finder
            </div>
            <div style={{ display: "flex", fontSize: "24px", color: "#aeb7c7" }}>Daily inventory. DB-first reads. Canonical video pages.</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: "76px", lineHeight: 0.94, letterSpacing: "-0.07em", fontWeight: 800 }}>
            <span>Find the next sports preview</span>
            <span>without request-time YouTube calls.</span>
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#aeb7c7", maxWidth: "960px" }}>
            Verified inventory pages for NFL, NBA, MLB, NHL, draft, playoff, season, and upcoming sports video discovery.
          </div>
        </div>
      </div>
    ),
    size
  );
}
