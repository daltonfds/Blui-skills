import { ImageResponse } from "next/og";
import { createElement as h } from "react";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 512, height: 512 };

export async function GET() {
  return new ImageResponse(
    h("div", {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "24%",
        background: "#000000",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontSize: 300,
        fontWeight: 800,
        letterSpacing: "-20px",
        paddingRight: "20px"
      },
      children: "B"
    }),
    { width: 512, height: 512 }
  );
}
