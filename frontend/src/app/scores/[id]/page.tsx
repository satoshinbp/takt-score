"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DetailPage from "@/app/scores/[id]/_components/detail-page";
import { useTranslation } from "@/hooks/use-translation";
import { type Score } from "@/lib/constants";
import { deleteScore, getScore, updateScore } from "@/lib/storage";

const ScoreDetailPage = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [score, setScore] = useState<Score | null | undefined>(undefined);
  const { t } = useTranslation();

  useEffect(() => {
    void (async () => {
      setScore(await getScore(id));
    })();
  }, [id]);

  if (score === undefined) return null;

  const handleSave = async (updated: Score) => {
    const next = await updateScore(updated.id, {
      title: updated.title,
      bpm: updated.bpm,
      measures: updated.measures,
    });
    setScore(next);
  };

  const handleDelete = async () => {
    if (!score) return;
    if (!confirm(t("detail.confirmDelete", { title: score.title }))) return;
    await deleteScore(score.id);
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
