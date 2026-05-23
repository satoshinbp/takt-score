"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DetailPage from "@/app/scores/[id]/_components/detail-page";
import { useTranslation } from "@/hooks/use-translation";
import { type Score } from "@/lib/constants";
import { loadScores, saveScores } from "@/lib/storage";

const ScoreDetailPage = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [scores, setScores] = useState<Score[] | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    void (async () => {
      setScores(await loadScores());
    })();
  }, []);

  if (!scores) return null;

  const score = scores.find((s) => s.id === id) ?? null;

  const handleSave = async (updated: Score) => {
    const next = scores.map((s) => (s.id === updated.id ? updated : s));
    await saveScores(next);
    setScores(next);
  };

  const handleDelete = async () => {
    if (!confirm(t("detail.confirmDelete", { title: score!.title }))) return;
    await saveScores(scores.filter((s) => s.id !== id));
    router.push("/");
  };

  if (!score) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        {t("detail.notFound")}
      </div>
    );
  }

  return (
    <DetailPage
      key={id}
      score={score}
      onSave={(s) => void handleSave(s)}
      onBack={() => router.push("/")}
      onDelete={() => void handleDelete()}
    />
  );
};

export default ScoreDetailPage;
