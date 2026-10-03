/** Technical verification / infra files that must remain publicly reachable but are not content pages. */
export function isTechnicalStaticFile(relativePath: string) {
  const local = relativePath.replace(/\\/g, "/");
  const base = local.split("/").pop() || "";
  if (/^google[a-z0-9_-]*\.html$/i.test(base)) return true;
  if (/^(robots\.txt|ads\.txt|sitemap\.xml)$/i.test(base)) return true;
  if (local === "robots.txt" || local === "ads.txt" || local === "sitemap.xml") return true;
  if (local.startsWith(".well-known/")) return true;
  return false;
}
