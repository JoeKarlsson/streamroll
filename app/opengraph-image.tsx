import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "StreamRoll — AI-generated streaming intros for Plex, Jellyfin & Emby";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080808",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Warm glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 55% at 50% -5%, rgba(255,248,180,0.09) 0%, transparent 65%)",
          }}
        />

        {/* Label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            color: "#525252",
            fontSize: 18,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 40, height: 1, background: "#2a2a2a" }} />
          Now Showing
          <div style={{ width: 40, height: 1, background: "#2a2a2a" }} />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: "-3px",
            color: "white",
            marginBottom: 20,
          }}
        >
          StreamRoll
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: "#737373",
            marginBottom: 48,
            textAlign: "center",
            maxWidth: 680,
          }}
        >
          AI-generated pre-roll intros for your media server, ready in 30 seconds
        </div>

        {/* Platform pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Plex", color: "#EBAF00" },
            { label: "Jellyfin", color: "#00A4DC" },
            { label: "Emby", color: "#52B54B" },
          ].map((p) => (
            <div
              key={p.label}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                border: `1px solid ${p.color}40`,
                background: `${p.color}12`,
                color: p.color,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {p.label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 15,
            color: "#333",
          }}
        >
          Powered by Runway API · streamroll.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
