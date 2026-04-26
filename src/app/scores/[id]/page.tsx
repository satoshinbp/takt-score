"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DetailPage } from "@/components/detail-page";
import { Header } from "@/components/header";
import { type Score } from "@/lib/constants";
import { loadScores, saveScores } from "@/lib/storage";

const ScoreDetailPage = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [scores, setScores] = useState<Score[] | null>(null);

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
    if (!confirm(`「${score!.title}」を削除しますか？`)) return;
    await saveScores(scores.filter((s) => s.id !== id));
    router.push("/");
  };

  if (!score) {
    return (
      <div className="flex flex-col overflow-hidden h-screen bg-background text-foreground">
        <Header />
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          スコアが見つかりません
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden h-screen bg-background text-foreground">
      <Header />
      <DetailPage
        key={id}
        score={score}
        onSave={(s) => void handleSave(s)}
        onBack={() => router.push("/")}
        onDelete={() => void handleDelete()}
      />
    </div>
  );
};

export default ScoreDetailPage;
