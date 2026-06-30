"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/lib/i18n/navigation";
import Button from "@/components/ui/Button";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

function BrandMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className="text-primary"
    >
      <rect x="0.75" y="0.75" width="9.5" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.75" y="0.75" width="9.5" height="9.5" rx="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="0.75" y="11.75" width="9.5" height="9.5" rx="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.75" y="11.75" width="9.5" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

interface NavbarClientProps {
  isAuthenticated: boolean;
}

export default function NavbarClient({ isAuthenticated }: NavbarClientProps) {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const centerLinks = isAuthenticated
    ? [
        { href: "/dashboard", label: t("dashboard") },
        { href: "/games", label: t("games") },
        { href: "/rooms", label: t("rooms") },
      ]
    : [
        { href: "/games", label: t("games") },
        { href: "/#features", label: t("features") },
        { href: "/#how-it-works", label: t("howItWorks") },
      ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-background/85 backdrop-blur-md shadow-[0_8px_30px_-20px_rgba(0,0,0,0.8)]"
          : "border-transparent bg-background/40 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-2 items-center px-6 md:grid-cols-3">
        {/* Left: brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-text"
        >
          <BrandMark />
          {t("brand")}
        </Link>

        {/* Center: primary nav */}
        <nav className="hidden items-center justify-center gap-8 md:flex">
          {centerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors duration-200 hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: auth + language + CTA */}
        <div className="hidden items-center justify-end gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                className="text-sm font-medium text-muted transition-colors duration-200 hover:text-text"
              >
                {t("profile")}
              </Link>
              <LanguageSwitcher />
              <form action={logoutAction}>
                <Button type="submit" variant="secondary" className="px-5 py-2.5">
                  {t("logout")}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted transition-colors duration-200 hover:text-text"
              >
                {t("login")}
              </Link>
              <LanguageSwitcher />
              <Button href="/register" variant="primary" className="px-5 py-2.5">
                {t("startPlaying")}
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="ms-auto flex h-10 w-10 items-center justify-center rounded-full border border-border text-text md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            {open ? (
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M2 5H16M2 9H16M2 13H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {centerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-text"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-text"
                >
                  {t("profile")}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-text"
                >
                  {t("login")}
                </Link>
              )}
              <div className="mt-2 flex items-center justify-between gap-3 px-3">
                <LanguageSwitcher />
                {isAuthenticated ? (
                  <form action={logoutAction}>
                    <Button type="submit" variant="secondary">
                      {t("logout")}
                    </Button>
                  </form>
                ) : (
                  <Button href="/register" variant="primary">
                    {t("startPlaying")}
                  </Button>
                )}
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
