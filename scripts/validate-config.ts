import { integrations } from "../config/integrations";
import { siteConfig } from "../config/site";
import { themes } from "../config/themes";
import type { InternalLink, PageSection, SeoPageDefinition } from "../config/types";
import { homePage } from "../content/home";
import { allPages, enabledCorePages, enabledPages } from "../content/registry";

const errors: string[] = [];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function fail(message: string) {
  errors.push(message);
}

function linksFromSections(sections: PageSection[]): InternalLink[] {
  return sections.flatMap((section) => section.links ?? []);
}

function validatePage(page: SeoPageDefinition) {
  if (!page.slug || !slugPattern.test(page.slug)) fail(`Invalid slug: ${page.slug || "(empty)"}`);
  if (!page.title.trim() || page.title.length > 65) fail(`${page.slug}: title must be 1-65 characters`);
  if (page.description.length < 80 || page.description.length > 170) fail(`${page.slug}: description must be 80-170 characters`);
  if (!page.hero.heading.trim()) fail(`${page.slug}: H1 is required`);
  if (!page.sections.length) fail(`${page.slug}: at least one H2 section is required`);
  if (!page.primaryKeyword.trim()) fail(`${page.slug}: primaryKeyword is required`);
  if (!page.searchIntent.trim()) fail(`${page.slug}: searchIntent is required`);
  if (!isoDatePattern.test(page.lastReviewed) || Number.isNaN(Date.parse(page.lastReviewed))) fail(`${page.slug}: invalid lastReviewed date`);
  for (const section of page.sections) {
    if (!section.id || !section.heading) fail(`${page.slug}: every section needs an id and H2 heading`);
    for (const subsection of section.subsections ?? []) {
      if (!subsection.heading) fail(`${page.slug}: every subsection needs an H3 heading`);
    }
  }
  for (const target of page.densityTargets ?? []) {
    if (!target.term || target.min < 0 || target.max <= target.min) fail(`${page.slug}: invalid density target for ${target.term}`);
  }
}

if (!themes[siteConfig.theme.preset]) fail(`Unknown theme preset: ${siteConfig.theme.preset}`);

try {
  new URL(siteConfig.hosting.siteUrl);
} catch {
  fail("hosting.siteUrl must be a valid absolute URL");
}

const siteHost = (() => {
  try { return new URL(siteConfig.hosting.siteUrl).hostname; } catch { return ""; }
})();

if (siteConfig.hosting.basePath && !/^\/[a-zA-Z0-9._-]+$/.test(siteConfig.hosting.basePath)) {
  fail("hosting.basePath must be empty or a single path beginning with /");
}

if (siteConfig.hosting.customDomain && siteConfig.hosting.basePath) {
  fail("customDomain and basePath cannot be enabled together");
}

if (siteConfig.hosting.customDomain) {
  if (siteConfig.hosting.customDomain.includes("://") || siteConfig.hosting.customDomain.includes("/")) {
    fail("customDomain must be a hostname without protocol or path");
  }
  if (siteHost && siteConfig.hosting.customDomain !== siteHost) {
    fail("customDomain must match the hostname in siteUrl");
  }
}

const slugs = allPages.map((page) => page.slug);
for (const slug of new Set(slugs)) {
  if (slugs.filter((value) => value === slug).length > 1) fail(`Duplicate page slug: ${slug}`);
}

allPages.forEach(validatePage);

const enabledSlugs = new Set(enabledPages.map((page) => page.slug));
for (const page of enabledPages) {
  for (const related of page.relatedSlugs ?? []) {
    if (!enabledSlugs.has(related)) fail(`${page.slug}: related page is missing or disabled: ${related}`);
  }
  for (const link of linksFromSections(page.sections)) {
    if (!enabledSlugs.has(link.slug)) fail(`${page.slug}: internal link is missing or disabled: ${link.slug}`);
  }
}
for (const link of linksFromSections(homePage.sections)) {
  if (!enabledSlugs.has(link.slug)) fail(`home: internal link is missing or disabled: ${link.slug}`);
}
if (homePage.hero.primaryLink && !enabledSlugs.has(homePage.hero.primaryLink.slug)) fail("home: primary hero link is missing or disabled");

const homeTargets = new Set([
  ...(homePage.hero.primaryLink ? [homePage.hero.primaryLink.slug] : []),
  ...linksFromSections(homePage.sections).map((link) => link.slug),
]);
for (const page of enabledCorePages) {
  if ((page.priority === "P0" || page.priority === "P1") && !homeTargets.has(page.slug)) {
    fail(`home: missing crawlable link to ${page.priority} page ${page.slug}`);
  }
  const inbound = enabledPages.some((source) =>
    source.slug !== page.slug && ((source.relatedSlugs ?? []).includes(page.slug) || linksFromSections(source.sections).some((link) => link.slug === page.slug)),
  );
  if (!homeTargets.has(page.slug) && !inbound) fail(`${page.slug}: orphan page has no inbound link`);
}

const externalUrls = [
  siteConfig.game.officialUrl,
  siteConfig.contact.url,
  siteConfig.repositoryUrl,
].filter((value): value is string => Boolean(value));

for (const url of externalUrls) {
  try {
    const host = new URL(url).hostname;
    if (host !== siteHost && !siteConfig.allowedExternalDomains.includes(host)) {
      fail(`External domain is not allowlisted: ${host}`);
    }
  } catch {
    fail(`Invalid external URL: ${url}`);
  }
}

if (siteConfig.readyForLaunch) {
  const launchData = JSON.stringify({ siteConfig, homePage, allPages }).toLowerCase();
  const placeholders = ["example game", "example studio", "game wiki template", "template-logo", "template-cover", "template-og", "placeholder"];
  for (const placeholder of placeholders) {
    if (launchData.includes(placeholder)) fail(`Launch blocked by placeholder value: ${placeholder}`);
  }
  if (!siteConfig.hosting.siteUrl.startsWith("https://") || siteHost === "example.github.io") fail("Launch requires a real HTTPS site URL");
  if (!siteConfig.contact.email && !siteConfig.contact.url) fail("Launch requires a public contact method");
  if (!enabledCorePages.length && !homePage.sections.length) fail("Launch requires useful homepage content or at least one approved content page");
  if (!homePage.title || !homePage.description || !homePage.sections.length || !homePage.faq.length) fail("Homepage SEO fields are incomplete");
}

if (errors.length) {
  console.error("Configuration validation failed:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Configuration valid: ${enabledPages.length + 1} public pages, theme ${siteConfig.theme.preset}, indexing ${siteConfig.readyForLaunch ? "enabled" : "disabled"}.`);
