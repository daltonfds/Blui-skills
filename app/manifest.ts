import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BluiSkill",
    short_name: "BluiSkill",
    description: "O teu espaço de trabalho para planear produtos, desenvolver software e estudar.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "any",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ],
    categories: ["productivity", "education", "utilities"],
    lang: "pt"
  };
}
