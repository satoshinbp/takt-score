"use client";

import Link from "next/link";
import * as Toolbar from "@radix-ui/react-toolbar";

type Props = {
  breadcrumb?: string;
  actions?: React.ReactNode;
};

export function Header({ breadcrumb, actions }: Props) {
  return (
    <Toolbar.Root asChild>
      <header
        className="flex items-center gap-3 px-5 flex-shrink-0 border-b z-[100]"
        style={{ height: 50, background: "var(--s1)", borderColor: "var(--bd)" }}
      >
        <Toolbar.Button asChild>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[15px] font-bold tracking-[0.06em] flex-shrink-0"
            style={{
              color: "var(--acc)",
              fontFamily: "var(--font-space-grotesk), sans-serif",
            }}
          >
            <span className="text-lg">🥁</span>
            <span>DRUM MASTER</span>
          </Link>
        </Toolbar.Button>

        {breadcrumb && (
          <span
            className="text-[11px] uppercase tracking-[0.06em]"
            style={{ color: "var(--tm)" }}
          >
            {breadcrumb}
          </span>
        )}

        {actions && (
          <div className="ml-auto flex items-center">{actions}</div>
        )}
      </header>
    </Toolbar.Root>
  );
}
