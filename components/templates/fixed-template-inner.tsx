import { FixedAdSlots } from "@/components/integrations/fixed-ad-slots";
import { JsonLd } from "@/components/site/json-ld";
import { siteConfig } from "@/config/site";
import { siteSkin } from "@/config/skin";
import type { SeoPageDefinition } from "@/config/types";
import { getRelatedPages, visibleCorePages } from "@/content/registry";
import { esc, renderFixedDocument } from "@/lib/fixed-template/render";
import { pageSchemas } from "@/lib/schema";
import { routePath } from "@/lib/urls";

function articleInner(page: SeoPageDefinition): string {
  const sections = page.sections.map((section) => {
    const paragraphs = [
      section.intro ? `<p>${esc(section.intro)}</p>` : "",
      ...(section.paragraphs ?? []).map((paragraph) => `<p>${esc(paragraph)}</p>`),
    ].join("");
    const steps = section.steps?.length
      ? `<ol>${section.steps.map((step) => `<li><b>${esc(step.heading)}</b> ${esc(step.description)}</li>`).join("")}</ol>`
      : "";
    const bullets = section.bullets?.length ? `<ul>${section.bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join("")}</ul>` : "";
    const table = section.table ? renderTable(section.table) : "";
    const subsections = (section.subsections ?? []).map((subsection) => {
      const copy = subsection.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");
      const bullets = subsection.bullets?.length ? `<ul>${subsection.bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join("")}</ul>` : "";
      return `<div class="article-subsection"><h3>${esc(subsection.heading)}</h3>${copy}${bullets}${subsection.table ? renderTable(subsection.table) : ""}</div>`;
    }).join("");
    const links = section.links?.length
      ? `<ul class="contextual-links">${section.links.map((link) => `<li><a href="${esc(routePath(link.slug))}">${esc(link.label)}</a>${link.description ? ` — ${esc(link.description)}` : ""}</li>`).join("")}</ul>`
      : "";
    return `<section id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${paragraphs}${bullets}${steps}${table}${subsections}${links}</section>`;
  }).join("");
  const faq = page.faq?.length
    ? `<section id="faq"><h2>FAQ</h2>${page.faq.map((item) => `<p><b>${esc(item.question)}</b> ${esc(item.answer)}</p>`).join("")}</section>`
    : "";
  const related = getRelatedPages(page);
  const relatedHtml = related.length
    ? `<section id="related"><h2>Related</h2><ul>${related.map((item) => `<li><a href="${esc(routePath(item.slug))}">${esc(item.navLabel)}</a></li>`).join("")}</ul></section>`
    : "";
  return `${sections}${faq}${relatedHtml}`;
}

function renderTable(table: { caption: string; columns: string[]; rows: string[][] }): string {
  return `<div class="table-scroll"><table><caption>${esc(table.caption)}</caption><thead><tr>${table.columns.map((column) => `<th scope="col">${esc(column)}</th>`).join("")}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

export function FixedTemplateInner({ page }: { page: SeoPageDefinition }) {
  const skin = siteSkin();
  const nav = visibleCorePages
    .filter((item) => item.slug.replace(/^\/+|\/+$/g, ""))
    .map((item) => ({ slug: item.slug.replace(/^\/+|\/+$/g, ""), label: item.navLabel, href: routePath(item.slug) }));
  const rendered = renderFixedDocument({
    skin,
    page: "inner",
    accentColorId: siteConfig.theme.accentColorId,
    gameName: siteConfig.game.name || siteConfig.shortName,
    nav,
    currentSlug: page.slug,
    homeHref: "/",
    logoUrl: null,
    heading: page.hero.heading,
    lead: page.hero.lead,
    articleHtml: articleInner(page),
  });
  return (
    <>
      <JsonLd data={pageSchemas(page)} />
      <div dangerouslySetInnerHTML={{ __html: rendered.rest }} />
      <FixedAdSlots />
    </>
  );
}
