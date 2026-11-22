import Image from "next/image";
import Link from "next/link";
import { storeConfig } from "@root/store.config";
import { CartLink } from "./cart-link";

export function Header() {
  const { logo, name, navigation, announcement } = storeConfig;
  return (
    <header className="border-border border-b">
      {announcement && (
        <p className="bg-primary text-primary-foreground px-4 py-2 text-center text-xs tracking-wide">
          {announcement}
        </p>
      )}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${name} home`}>
          {logo.src ? (
            <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} priority unoptimized />
          ) : (
            <span className="font-heading text-xl font-semibold">{name}</span>
          )}
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm">
            {navigation.header.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-accent">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <CartLink />
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none text-sm font-medium" aria-label="Menu">
              Menu
            </summary>
            <ul className="border-border bg-background absolute right-0 z-20 mt-3 w-48 rounded-[var(--radius-brand)] border p-2 shadow-lg">
              {navigation.header.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:bg-muted block rounded px-3 py-2 text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </header>
  );
}
