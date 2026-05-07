import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#10202d",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            border: "2px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            color: "#f4efe6",
            display: "flex",
            fontSize: 14,
            fontWeight: 700,
            height: 24,
            justifyContent: "center",
            width: 24
          }}
        >
          FO
        </div>
      </div>
    ),
    size
  );
}
