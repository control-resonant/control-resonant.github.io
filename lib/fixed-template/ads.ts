const BANNER_MARKER = '<div data-adsterra-banner></div>';
const NATIVE_MARKER = '<div data-adsterra-native></div>';

function balancedCloseIndex(html: string, openStart: number, tag: string): number {
  const openPrefix = `<${tag}`;
  const closer = `</${tag}>`;
  const openEnd = html.indexOf(">", openStart);
  if (openEnd < 0) return -1;
  let depth = 1;
  let index = openEnd + 1;
  while (index < html.length && depth > 0) {
    const nextOpen = html.indexOf(openPrefix, index);
    const nextClose = html.indexOf(closer, index);
    if (nextClose < 0) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      index = nextOpen + openPrefix.length;
    } else {
      depth -= 1;
      index = nextClose + closer.length;
    }
  }
  return depth === 0 ? index : -1;
}

function insertAfter(html: string, index: number, marker: string): string {
  return `${html.slice(0, index)}${marker}${html.slice(index)}`;
}

function heroCloseIndex(html: string): number {
  const candidates = [
    '<section class="hero">',
    '<section class="inner-hero">',
    '<header class="hero-wrap">',
    '<section class="panel hero">',
    '<article class="lead-card">',
  ];
  for (const candidate of candidates) {
    const start = html.indexOf(candidate);
    if (start < 0) continue;
    const tag = candidate.slice(1, candidate.indexOf(" ")).replace(">", "");
    const end = balancedCloseIndex(html, start, tag);
    if (end > 0) return end;
  }
  return -1;
}

// Banner goes immediately after the page hero; Native goes after the first
// real content block that follows the banner (guide-card grid on home, first
// article section on inner pages). Markers that cannot be placed reliably are
// skipped instead of guessed.
export function insertFixedAdMarkers(html: string, page: "home" | "inner"): string {
  let next = html;
  const bannerIndex = heroCloseIndex(next);
  if (bannerIndex < 0) return next;
  next = insertAfter(next, bannerIndex, BANNER_MARKER);

  if (page === "home") {
    const gridStart = next.indexOf('<section class="section">', bannerIndex);
    if (gridStart >= 0) {
      const gridEnd = balancedCloseIndex(next, gridStart, "section");
      if (gridEnd > 0) return insertAfter(next, gridEnd, NATIVE_MARKER);
    }
    const supplementStart = next.indexOf("<section id=", bannerIndex);
    if (supplementStart >= 0) {
      const supplementEnd = balancedCloseIndex(next, supplementStart, "section");
      if (supplementEnd > 0) return insertAfter(next, supplementEnd, NATIVE_MARKER);
    }
    return next;
  }

  const articleStart = next.indexOf("<article", bannerIndex);
  if (articleStart >= 0) {
    const sectionStart = next.indexOf("<section", articleStart);
    if (sectionStart >= 0) {
      const sectionEnd = balancedCloseIndex(next, sectionStart, "section");
      if (sectionEnd > 0) return insertAfter(next, sectionEnd, NATIVE_MARKER);
    }
  }
  return next;
}
