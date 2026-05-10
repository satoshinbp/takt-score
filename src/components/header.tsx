"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { TaktScoreIcon } from "@/components/icon";
import { cn } from "@/lib/utils";

const NAV_TABS = [
  { id: "scores", label: "SCORES", href: "/" },
  { id: "innertakt", label: "INNER TAKT", href: "/inner-takt" },
] as const;

const isActiveTab = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/" || pathname.startsWith("/scores");
  return pathname === href || pathname.startsWith(`${href}/`);
};

const Header = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-background",
        "flex items-center gap-4 px-6 min-h-12 border-b",
      )}
    >
      <Link href="/" className="flex items-center gap-2 text-lg font-bold">
        <TaktScoreIcon size={24} />
        TaktScore
      </Link>

      <nav className="flex gap-1 rounded-md border border-border bg-muted/40 p-0.5">
        {NAV_TABS.map((tab) => {
          const active = isActiveTab(pathname, tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "rounded-sm px-3 py-1 text-[10px] font-bold tracking-[0.1em] transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
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
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded hover:bg-muted transition-colors"
          title={
            resolvedTheme === "dark"
              ? "ライトモードに切り替え"
              : "ダークモードに切り替え"
          }
        >
          {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
