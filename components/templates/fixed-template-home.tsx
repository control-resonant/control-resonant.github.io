import { FixedAdSlots } from "@/components/integrations/fixed-ad-slots";
import { Faq } from "@/components/site/faq";
import { JsonLd } from "@/components/site/json-ld";
import { siteConfig } from "@/config/site";
import { siteSkin } from "@/config/skin";
import type { HomePageDefinition, InternalLink } from "@/config/types";
import { visibleCorePages } from "@/content/registry";
import { esc, renderFixedDocument } from "@/lib/fixed-template/render";
import { homeSchemas } from "@/lib/schema";
import { assetPath, routePath } from "@/lib/urls";

function renderTable(table: { caption: string; columns: string[]; rows: string[][] }): string {
  return `<div class="table-scroll"><table><caption>${esc(table.caption)}</caption><thead><tr>${table.columns.map((column) => `<th scope="col">${esc(column)}</th>`).join("")}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function supplement(home: HomePageDefinition): string {
  const sections = home.sections.map((section) => {
    const paragraphs = (section.paragraphs ?? []).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");
    const intro = section.intro ? `<p>${esc(section.intro)}</p>` : "";
    const steps = section.steps?.length ? `<ol>${section.steps.map((step) => `<li><b>${esc(step.heading)}</b> ${esc(step.description)}</li>`).join("")}</ol>` : "";
    const subsections = (section.subsections ?? []).map((subsection) => `<div class="article-subsection"><h3>${esc(subsection.heading)}</h3>${subsection.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}${subsection.bullets?.length ? `<ul>${subsection.bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join("")}</ul>` : ""}${subsection.table ? renderTable(subsection.table) : ""}</div>`).join("");
    const links = section.links?.length ? `<ul class="contextual-links">${section.links.map((link) => `<li><a href="${esc(routePath(link.slug))}">${esc(link.label)}</a>${link.description ? ` — ${esc(link.description)}` : ""}</li>`).join("")}</ul>` : "";
    const bullets = section.bullets?.length ? `<ul>${section.bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join("")}</ul>` : "";
    return `<section id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${intro}${paragraphs}${bullets}${steps}${section.table ? renderTable(section.table) : ""}${subsections}${links}</section>`;
  }).join("");
  return sections;
}

export function FixedTemplateHome({ home }: { home: HomePageDefinition }) {
  const skin = siteSkin();
  const links: InternalLink[] = visibleCorePages
    .filter((page) => page.slug.replace(/^\/+|\/+$/g, ""))
    .map((page) => ({ slug: page.slug, label: page.navLabel, description: page.description }));
  const entries = links.map((link) => ({
    href: routePath(link.slug),
    title: link.label,
    text: link.description || `Open the ${link.label} guide.`,
  }));
  const rendered = renderFixedDocument({
    skin,
    page: "home",
    accentColorId: siteConfig.theme.accentColorId,
    gameName: siteConfig.game.name || siteConfig.shortName,
    nav: links.map((link) => ({ slug: link.slug, label: link.label, href: routePath(link.slug) })),
    homeHref: "/",
    logoUrl: assetPath(siteConfig.assets.logo),
    bannerUrl: assetPath(siteConfig.assets.cover),
    heading: home.hero.heading,
    lead: home.hero.lead,
    entries,
    supplementHtml: supplement(home),
  });
  return (
    <>
      <JsonLd data={homeSchemas(home)} />
      <div dangerouslySetInnerHTML={{ __html: rendered.rest }} />
      <FixedAdSlots />
      {home.faq.length ? (
        <div className="site-container"><Faq items={home.faq} /></div>
      ) : null}
    </>
  );
}
