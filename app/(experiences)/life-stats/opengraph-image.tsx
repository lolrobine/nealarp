import { ImageResponse } from "next/og";
export const runtime = "edge";
export const dynamic = "force-static";
export const alt = "📊 Life Stats — Nealarp";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1e1b4b 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 800 }}>📊 Life Stats</div>
      <div style={{ fontSize: 28, marginTop: 16, color: "#a3a3a3" }}>Your life in numbers</div>
      <div style={{ fontSize: 18, marginTop: 20, color: "#6366f1" }}>Nealarp</div>
    </div>,
    { ...size }
  );
}
