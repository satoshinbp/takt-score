"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { TaktScoreIcon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export const Header = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-background",
        "flex items-center gap-4 px-6 min-h-12 border-b",
      )}
    >
      <button>
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <TaktScoreIcon size={24} />
          TaktScore
        </Link>
      </button>

      <div className="ml-auto flex items-center">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded hover:bg-muted transition-colors"
          title={resolvedTheme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
          {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
