"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { type Score } from "@/lib/constants";
import { loadScores, saveScores } from "@/lib/storage";
import { Header } from "@/components/Header";
import { DetailPage } from "@/components/DetailPage";

export default function ScoreDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [scores, setScores] = useState<Score[] | null>(null);

  useEffect(() => {
    loadScores().then(setScores);
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
      <div className="flex flex-col overflow-hidden h-screen bg-[var(--background)] text-[var(--text)]">
        <Header />
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
          スコアが見つかりません
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden h-screen bg-[var(--background)] text-[var(--text)]">
      <Header
        breadcrumb={score.title}
        actions={
          <button
            onClick={handleDelete}
            className="text-[11px] px-2.5 py-1 rounded transition-all duration-[120ms] border border-transparent text-[var(--danger)] hover:bg-[rgba(255,68,102,.1)]"
          >
            削除
          </button>
        }
      />
      <DetailPage
        key={id}
        score={score}
        onSave={handleSave}
        onBack={() => router.push("/")}
      />
    </div>
  );
}
