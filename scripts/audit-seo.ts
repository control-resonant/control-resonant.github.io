import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { siteConfig } from "../config/site";
import type { HomePageDefinition, SeoPageDefinition } from "../config/types";
import { homePage } from "../content/home";
import { enabledCorePages, enabledPages } from "../content/registry";
import { pagePlainText, termCount, wordCount } from "../lib/content";
import { absoluteUrl } from "../lib/urls";
import { isTechnicalStaticFile } from "./seo-audit-paths";

const output = join(process.cwd(), "out");
const errors: string[] = [];

function collectHtml(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? collectHtml(path) : path.endsWith(".html") ? [path] : [];
  });
}

function count(html: string, pattern: RegExp) {
  return (html.match(pattern) ?? []).length;
}

function routeForFile(path: string) {
  const local = relative(output, path).split(sep).join("/");
  if (local === "index.html") return "/";
  if (local.endsWith("/index.html")) return `/${local.slice(0, -"/index.html".length)}/`;
  return `/${local}`;
}

function hrefs(html: string) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: match[1],
    text: match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  }));
}

function normalizeInternalHref(href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const withoutQuery = href.split(/[?#]/)[0];
  const base = siteConfig.hosting.basePath.replace(/\/+$/, "");
  const route = base && withoutQuery.startsWith(`${base}/`) ? withoutQuery.slice(base.length) : withoutQuery;
  return route || "/";
}

if (!existsSync(output)) {
  console.error("SEO audit failed: out/ does not exist. Run the production build first.");
  process.exit(1);
}

const expectedRoutes = new Set(["/", ...enabledPages.map((page) => `/${page.slug}/`)]);
const allHtmlFiles = collectHtml(output);
const contentFiles = allHtmlFiles.filter((path) => {
  const local = relative(output, path).split(sep).join("/");
  if (isTechnicalStaticFile(local)) return false;
  const route = routeForFile(path);
  return route !== "/404/" && route !== "/_not-found/" && route !== "/404.html" && route !== "/_not-found.html";
});
const actualRoutes = new Set(contentFiles.map(routeForFile));

for (const route of expectedRoutes) if (!actualRoutes.has(route)) errors.push(`${route}: expected static page is missing`);
for (const route of actualRoutes) if (!expectedRoutes.has(route)) errors.push(`${route}: generated HTML has no enabled registry page`);

// Verification / infra files must survive into the build output and stay reachable.
const publicDir = join(process.cwd(), "public");
if (existsSync(publicDir)) {
  const publicTechnical = collectHtml(publicDir)
    .map((path) => relative(publicDir, path).split(sep).join("/"))
    .filter((local) => isTechnicalStaticFile(local));
  for (const local of publicTechnical) {
    const built = join(output, local);
    if (!existsSync(built)) errors.push(`technical file missing from build output: /${local}`);
  }
}

const knownRoutes = new Set(["/", ...enabledPages.map((page) => `/${page.slug}/`)]);
const seenTitles = new Map<string, string>();
const pageByRoute = new Map<string, HomePageDefinition | SeoPageDefinition>([["/", homePage], ...enabledPages.map((page) => [`/${page.slug}/`, page] as const)]);
const forbiddenCopy = ["details are left out until", "stays limited to sourced facts", "manual_fast_path", "fact pack", "skeleton", "publicly confirmed for control resonant", "example.github.io", "/control-resonant/images"];
const seenParagraphs = new Map<string, string>();

for (const [route, page] of pageByRoute) {
  if (page.pageType === "legal") continue;
  const minimum = route === "/" ? 1200 : 800;
  const words = wordCount(pagePlainText(page));
  if (words < minimum) errors.push(`${route}: ${words} words is below the ${minimum}-word content minimum`);
  if (page.title.length > 60) errors.push(`${route}: title exceeds 60 characters`);
  for (const section of page.sections) {
    for (const paragraph of [section.intro, ...(section.paragraphs ?? []), ...(section.subsections ?? []).flatMap((subsection) => subsection.paragraphs)]) {
      if (!paragraph || paragraph.length < 80) continue;
      const normalized = paragraph.toLowerCase().replace(/\s+/g, " ").trim();
      const previous = seenParagraphs.get(normalized);
      if (previous) errors.push(`${route}: repeated paragraph also used on ${previous}`);
      else seenParagraphs.set(normalized, route);
    }
  }
}

for (const file of contentFiles) {
  const html = readFileSync(file, "utf8");
  const route = routeForFile(file);
  const page = pageByRoute.get(route);
  const lowerHtml = html.toLowerCase();
  for (const phrase of forbiddenCopy) if (lowerHtml.includes(phrase)) errors.push(`${route}: forbidden production copy: ${phrase}`);
  if (page) {
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i)?.[1];
    if (canonical !== absoluteUrl(page.slug)) errors.push(`${route}: canonical does not match the root-domain route`);
    for (const section of page.sections) {
      if (!html.includes(`id="${section.id}"`)) errors.push(`${route}: section ${section.id} missing from static HTML`);
    }
    if (page.pageType !== "legal") {
      const header = html.match(/<header[\s\S]*?<\/header>/i)?.[0] ?? "";
      for (const core of enabledCorePages) if (!header.includes(`href="/${core.slug}/"`)) errors.push(`${route}: header missing ${core.slug}`);
    }
  }
  const h1Count = count(html, /<h1\b/gi);
  if (h1Count !== 1) errors.push(`${route}: expected one H1, found ${h1Count}`);
  if (!/<h2\b/i.test(html)) errors.push(`${route}: no H2 found`);
  const firstH2 = html.search(/<h2\b/i);
  const firstH3 = html.search(/<h3\b/i);
  if (firstH3 >= 0 && (firstH2 < 0 || firstH3 < firstH2)) errors.push(`${route}: H3 appears before the first H2`);
  if (!/<meta\s+name=["']description["'][^>]+content=["'][^"']{40,}["']/i.test(html) && !/<meta\s+content=["'][^"']{40,}["'][^>]+name=["']description["']/i.test(html)) errors.push(`${route}: meta description missing or too short`);
  for (const field of ["canonical", "og:title", "og:description", "og:url", "twitter:card"]) {
    if (!html.toLowerCase().includes(field)) errors.push(`${route}: metadata field missing: ${field}`);
  }
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  if (!title) errors.push(`${route}: title element missing`);
  else if (seenTitles.has(title)) errors.push(`${route}: duplicate title also used by ${seenTitles.get(title)}`);
  else seenTitles.set(title, route);
  const robots = html.match(/<meta\s+name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta\s+content=["']([^"']+)["'][^>]+name=["']robots["']/i)?.[1];
  const expectedRobot = siteConfig.readyForLaunch ? "index" : "noindex";
  if (!robots?.toLowerCase().includes(expectedRobot)) errors.push(`${route}: robots must include ${expectedRobot}`);
  for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt=["'][^"']*["']/i.test(image[1])) errors.push(`${route}: image without alt attribute`);
  }
  for (const link of hrefs(html)) {
    const internal = normalizeInternalHref(link.href);
    if (!internal || /\.[a-z0-9]+$/i.test(internal)) continue;
    const normalized = internal.endsWith("/") ? internal : `${internal}/`;
    if (!knownRoutes.has(normalized)) errors.push(`${route}: broken internal link ${link.href}`);
  }
}

const homeHtml = readFileSync(join(output, "index.html"), "utf8");
const homeLinks = hrefs(homeHtml);
for (const page of enabledCorePages.filter((page) => page.priority === "P0" || page.priority === "P1")) {
  const target = `/${page.slug}/`;
  const matches = homeLinks.filter((link) => {
    const href = normalizeInternalHref(link.href);
    return href === target || href === target.slice(0, -1);
  });
  if (matches.length < 1) errors.push(`home: ${target} needs at least one crawlable internal link`);
}

function reportDensity(page: HomePageDefinition | SeoPageDefinition) {
  const text = pagePlainText(page);
  const words = wordCount(text);
  for (const target of page.densityTargets ?? []) {
    const density = words ? (termCount(text, target.term) / words) * 100 : 0;
    const status = density >= target.min && density <= target.max ? "within target" : "review suggested";
    console.log(`Density ${page.slug || "home"} · ${target.term}: ${density.toFixed(2)}% (${target.min}-${target.max}%, ${status})`);
  }
}

reportDensity(homePage);
enabledPages.forEach(reportDensity);

if (errors.length) {
  console.error("SEO audit failed:\n" + [...new Set(errors)].map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

const skippedTechnical = allHtmlFiles.length - contentFiles.length;
writeFileSync(join(process.cwd(), "QA_REPORT.json"), JSON.stringify({
  generatedBy: "npm run audit:seo",
  generatedAt: new Date().toISOString(),
  passed: true,
  warnings: [],
  contentPages: contentFiles.length,
  checkedRoutes: [...actualRoutes].sort(),
  wordCounts: Object.fromEntries([...pageByRoute].filter(([, page]) => page.pageType !== "legal").map(([route, page]) => [route, wordCount(pagePlainText(page))])),
  checks: ["static route coverage", "single H1", "metadata and self canonical", "internal links", "header guide access", "minimum word count", "duplicate paragraphs", "forbidden production copy", "section rendering"],
}, null, 2) + "\n");
console.log(`SEO audit passed for ${contentFiles.length} content HTML pages${skippedTechnical ? ` (skipped ${skippedTechnical} technical HTML file(s))` : ""}.`);
