import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sri Lanka Street Workout & Calisthenics Association",
    short_name: "SLSWCA",
    start_url: "/",
    display: "standalone",
    background_color: "#131210",
    theme_color: "#131210",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
