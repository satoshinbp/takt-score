"use client";

import Link from "next/link";
import { TaktScoreIcon } from "@/components/Icon";
import { cn } from "@/lib/utils";

type Props = {
  actions?: React.ReactNode;
};

export const Header = ({ actions }: Props) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-background",
        "flex items-center gap-4 px-6 h-12",
      )}
    >
      <button>
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-wider"
        >
          <TaktScoreIcon size={24} />
          TaktScore
        </Link>
      </button>

      {actions && <div className="ml-auto flex items-center">{actions}</div>}
    </header>
  );
};
