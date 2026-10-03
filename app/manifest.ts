import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { themes } from "@/config/themes";
import { assetPath } from "@/lib/urls";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const theme = themes[siteConfig.theme.preset];
  return {
    name: siteConfig.siteName,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: assetPath("/"),
    display: "standalone",
    background_color: `hsl(${theme.tokens.background})`,
    theme_color: `hsl(${theme.tokens.primary})`,
    icons: [{ src: assetPath(siteConfig.assets.logo), sizes: "any", type: "image/svg+xml" }],
  };
}
