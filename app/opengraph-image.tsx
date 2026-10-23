import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Nealarp - Interactive Web Experiences";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1e1b4b 50%, #0a0a0a 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          background: "linear-gradient(to right, #6ee7b7, #22d3ee, #38bdf8)",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        Nealarp
      </div>
      <div style={{ fontSize: 28, marginTop: 20, color: "#a3a3a3" }}>
        Interactive web experiences
      </div>
      {/* Plain shapes, not emoji: Satori rasterises emoji by fetching them from a
          CDN, which makes the build depend on the network. These are pure CSS. */}
      <div style={{ display: "flex", gap: 20, marginTop: 44 }}>
        {["#6ee7b7", "#22d3ee", "#38bdf8", "#818cf8"].map((colour) => (
          <div
            key={colour}
            style={{ width: 28, height: 28, borderRadius: 999, background: colour }}
          />
        ))}
      </div>
    </div>,
    { ...size }
  );
}
