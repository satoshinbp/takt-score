"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DetailPage from "@/app/scores/[id]/_components/detail-page";
import { useTranslation } from "@/hooks/useTranslation";
import { deleteScore, getScore, updateScore } from "@/services/score";
import { type ScoreDetail } from "@/types/common";

const ScoreDetailInner = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  // Set when arriving from "save & continue" on a brand-new score so the
  // detail page opens straight into the editor instead of the viewer.
  const shouldStartEditing = useSearchParams().get("edit") === "1";
  const [score, setScore] = useState<ScoreDetail | null | undefined>(undefined);
  const { t } = useTranslation();

  useEffect(() => {
    // Guard against a stale response winning if `id` changes mid-fetch.
    let isCancelled = false;
    void (async () => {
      const fetched = await getScore(id);
      if (!isCancelled) setScore(fetched);
    })();
    return () => {
      isCancelled = true;
    };
  }, [id]);

  if (score === undefined) return null;

  const handleSave = async (updated: ScoreDetail) => {
    const next = await updateScore(updated.id, {
      title: updated.title,
      bpm: updated.bpm,
      spotifyTrackId: updated.spotifyTrackId,
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
      initialEditing={shouldStartEditing}
      onSave={(s) => void handleSave(s)}
      onBack={() => router.push("/")}
      onDelete={() => void handleDelete()}
    />
  );
};

const ScoreDetailPage = () => (
  <Suspense fallback={null}>
    <ScoreDetailInner />
  </Suspense>
);

export default ScoreDetailPage;
