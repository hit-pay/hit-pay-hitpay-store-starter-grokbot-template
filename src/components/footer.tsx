import Link from "next/link";
import { storeConfig } from "@root/store.config";

const SOCIAL_LABELS: Record<keyof typeof storeConfig.social, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

export function Footer() {
  const { name, tagline, navigation, social, contact } = storeConfig;
  const socialLinks = (Object.keys(SOCIAL_LABELS) as Array<keyof typeof social>).filter(
    (key) => social[key],
  );

  return (
    <footer className="border-border bg-muted mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[2fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <p className="font-heading text-lg font-semibold">{name}</p>
          <p className="text-muted-foreground max-w-xs text-sm">{tagline}</p>
          {contact.email && (
            <p className="text-sm">
              <a href={`mailto:${contact.email}`} className="hover:text-accent">
                {contact.email}
              </a>
            </p>
          )}
          {socialLinks.length > 0 && (
            <ul className="flex flex-wrap gap-4 pt-2 text-sm">
              {socialLinks.map((key) => (
                <li key={key}>
                  <a href={social[key]} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                    {SOCIAL_LABELS[key]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {navigation.footer.map((group) => (
          <div key={group.title}>
            <p className="mb-3 text-sm font-semibold">{group.title}</p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-border text-muted-foreground border-t px-4 py-6 text-center text-xs">
        © {name}. Secure checkout powered by HitPay.
      </div>
    </footer>
  );
}
