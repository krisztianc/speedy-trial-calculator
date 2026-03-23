import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "#0f172a",
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "40px",
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.7 }}>
          Washington State
        </div>
        <div style={{ marginTop: 20 }}>
          Speedy Trial Calculator
        </div>
        <div style={{ fontSize: 28, marginTop: 20, opacity: 0.8 }}>
          CrR 3.3 / CrRLJ 3.3
        </div>
      </div>
    ),
    size,
  );
}