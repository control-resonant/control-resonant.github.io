import { siteConfig } from "@/config/site";

export function isFixedTemplate(): boolean {
  return siteConfig.theme.appearanceMode === "fixed-template" || siteConfig.theme.templateVersion === 1;
}
