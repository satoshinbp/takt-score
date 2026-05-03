"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NewScoreCard = () => {
  return (
    <Link
      href="/scores/new"
      className={cn(
        "p-4 flex flex-col items-center justify-center gap-2 min-h-43 w-full",
        "transition-all border border-dashed bg-muted text-muted-foreground",
        "hover:text-primary hover:border-primary hover:-translate-y-px",
      )}
    >
      <Plus />
      <div className="text-xs font-medium">新規ドラム譜</div>
    </Link>
  );
};

export default NewScoreCard;
