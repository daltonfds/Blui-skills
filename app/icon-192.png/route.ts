import { ImageResponse } from "next/og";
import { createElement as h } from "react";

export const runtime = "edge";

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
        fontSize: 112,
        fontWeight: 800,
        letterSpacing: "-8px",
        paddingRight: "8px"
      },
      children: "B"
    }),
    { width: 192, height: 192 }
  );
}
