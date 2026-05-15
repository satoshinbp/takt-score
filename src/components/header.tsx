"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { TaktScoreIcon } from "@/components/icon";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

const NAV_TABS = [
  { id: "scores", label: "Scores", href: "/" },
  { id: "innertakt", label: "Inner Takt", href: "/inner-takt" },
] as const;

const isActiveTab = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/" || pathname.startsWith("/scores");
  return pathname === href || pathname.startsWith(`${href}/`);
};

const Header = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const { lang, setLang, t } = useTranslation();
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const isDark = isMounted && resolvedTheme === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-card text-card-foreground",
        "flex items-center gap-4 px-6 min-h-12 border-b"
      )}
    >
      <Link href="/" className="flex items-center gap-2 text-lg font-bold">
        <TaktScoreIcon size={24} />
        TaktScore
      </Link>

      <nav className="flex gap-1">
        {NAV_TABS.map((tab) => {
          const isActive = isActiveTab(pathname, tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "px-3 py-1 text-xs font-bold tracking-wider transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center">
        <button
          type="button"
          onClick={() => setLang(lang === "ja" ? "en" : "ja")}
          className={cn(
            "px-2 py-1 rounded hover:bg-muted transition-colors",
            "text-xs font-semibold tracking-wider"
          )}
          title={
            isMounted
              ? lang === "ja"
                ? t("header.langSwitchToEn")
                : t("header.langSwitchToJa")
              : undefined
          }
        >
          {isMounted ? (lang === "ja" ? "EN" : "JA") : "JA"}
        </button>
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="p-2 rounded hover:bg-muted transition-colors"
          title={
            isMounted
              ? isDark
                ? t("header.toLight")
                : t("header.toDark")
              : undefined
          }
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
