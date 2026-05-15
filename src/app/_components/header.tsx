"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

type Props = {
  count: number;
  onCreate: () => void;
};

const DashboardHeader = ({ count, onCreate }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-between items-end">
      <div>
        <div className="text-2xl font-bold">{t("dashboard.title")}</div>
        <div className="text-sm text-muted-foreground">
          {t("dashboard.count", { count })}
        </div>
      </div>
      <Button onClick={onCreate}>
        <Plus size={16} />
        {t("dashboard.newScore")}
      </Button>
    </div>
  );
};

export default DashboardHeader;
