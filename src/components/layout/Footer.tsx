import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export default function Footer() {
  const tNav = useTranslations("Nav");
  const tFooter = useTranslations("Footer");
  const year = new Date().getFullYear();

  const links = [
    { href: "/", label: tNav("home") },
    { href: "/games", label: tNav("games") },
    { href: "/login", label: tNav("login") },
    { href: "/register", label: tNav("register") },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-text">
            {tNav("brand")}
          </span>
          <p className="text-sm text-muted">{tFooter("tagline")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {tFooter("linksTitle")}
          </span>
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors duration-200 hover:text-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-border px-6 py-6">
        <p className="mx-auto max-w-6xl text-xs text-muted">
          © {year} {tNav("brand")}. {tFooter("rights")}
        </p>
      </div>
    </footer>
  );
}
