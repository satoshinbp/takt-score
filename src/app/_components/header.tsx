"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  count: number;
  onCreate: () => void;
};

const DashboardHeader = ({ count, onCreate }: Props) => {
  return (
    <div className="flex justify-between items-end">
      <div>
        <div className="text-2xl font-bold">My Scores</div>
        <div className="text-sm text-muted-foreground">{count}件</div>
      </div>
      <Button onClick={onCreate}>
        <Plus size={16} />
        新規ドラム譜
      </Button>
    </div>
  );
};

export default DashboardHeader;
