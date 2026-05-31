import type { MetadataRoute } from "next";

// Web app manifest (SPEC §7 Phase 6). Makes the app installable ("Add to Home
// Screen"). Next auto-injects <link rel="manifest"> because this file exists.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fuel — Weekly Endurance Fuelling",
    short_name: "Fuel",
    description:
      "Personalised weekly fuelling plans and grocery lists for endurance athletes.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
