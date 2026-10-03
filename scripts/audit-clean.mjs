import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const skippedDirs = new Set([".git", ".next", "node_modules", "out", ".playwright-cli", ".agent", ".claude"]);
// config/ads.ts is the sanctioned store of this site's own Adsterra unit IDs.
const skippedFiles = new Set(["package-lock.json", "audit-clean.mjs", "ads.ts"]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css", ".html", ".txt", ".yml", ".yaml"]);
const legacyLabels = [
  ["Scary", "Shawarma"].join(" "),
  ["Crazy", "Cattle"].join(" "),
  ["Steal", "An", "Egg"].join(" "),
  ["Ab", "solum"].join(""),
];
const findings = [];
const configuredContact = JSON.parse(readFileSync(join(root, "content/generated/site.json"), "utf8")).contact;
const configuredEmails = new Set([configuredContact?.email, configuredContact?.displayEmail].filter(Boolean));

function walk(directory) {
  for (const name of readdirSync(directory)) {
    if (skippedDirs.has(name)) continue;
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (textExtensions.has(extname(name)) && !skippedFiles.has(name)) inspect(path);
  }
}

function inspect(path) {
  const text = readFileSync(path, "utf8");
  const displayPath = relative(root, path);
  for (const label of legacyLabels) {
    if (text.toLowerCase().includes(label.toLowerCase())) findings.push(`${displayPath}: legacy identity '${label}'`);
  }
  const emails = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) ?? [];
  for (const email of emails) if (!configuredEmails.has(email) || displayPath !== "content/generated/site.json") findings.push(`${displayPath}: hardcoded email '${email}'`);
  const publisherIds = text.match(/\bca-pub-\d{8,}\b/gi) ?? [];
  for (const id of publisherIds) findings.push(`${displayPath}: hardcoded advertising publisher ID '${id}'`);
  if (/data-code=["'][A-Za-z0-9_-]{16,}["']/.test(text)) findings.push(`${displayPath}: hardcoded analytics code`);
  if (/container-[a-f0-9]{24,}/i.test(text)) findings.push(`${displayPath}: hardcoded advertising container ID`);
}

walk(root);

if (findings.length) {
  console.error("Cleanliness audit failed:\n" + findings.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Cleanliness audit passed: no legacy identity, unconfigured email or embedded third-party ID found.");
