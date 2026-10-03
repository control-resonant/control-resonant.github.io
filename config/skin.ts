import { siteConfig } from "./site";
import type { ThemeSkin } from "./types";

const SKINS: ThemeSkin[] = ["portal", "wiki", "resource", "editorial", "glass", "pixel", "horror"];

export function siteSkin(): ThemeSkin {
  const skin = siteConfig.theme.skin;
  return skin && SKINS.includes(skin) ? skin : "portal";
}
