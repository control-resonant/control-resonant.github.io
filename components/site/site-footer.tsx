import { ExternalLink, Mail } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { InternalLink } from "@/config/types";
import { routePath } from "@/lib/urls";

export function SiteFooter({ coreLinks, legalLinks }: { coreLinks: InternalLink[]; legalLinks: InternalLink[] }) {
  const contactHref = siteConfig.contact.email
    ? `mailto:${siteConfig.contact.email}`
    : siteConfig.contact.url;

  return (
    <footer className="mt-20 border-t border-border bg-card/45">
      <div className="site-container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="mb-3 text-lg font-black text-foreground">{siteConfig.siteName}</p>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">{siteConfig.description}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Independent, fan-made and not affiliated with the game developer or platform owner.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-widest text-foreground">Explore</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {coreLinks.map((link) => (
              <li key={link.slug}><Link className="hover:text-primary" href={routePath(link.slug)}>{link.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-widest text-foreground">Site</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {legalLinks.map((link) => (
              <li key={link.slug}><Link className="hover:text-primary" href={routePath(link.slug)}>{link.label}</Link></li>
            ))}
          </ul>
          {contactHref ? (
            <a className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary" href={contactHref}>
              {siteConfig.contact.email ? <Mail size={16} /> : <ExternalLink size={16} />}
              {siteConfig.contact.displayEmail ?? siteConfig.contact.email ?? "Contact the editorial team"}
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
