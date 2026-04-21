"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { type Score } from "@/lib/constants";
import { loadScores, saveScores } from "@/lib/storage";
import { Header } from "@/components/Header";
import { DetailPage } from "@/components/DetailPage";

export default function ScoreDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [scores, setScores] = useState(() => loadScores() ?? []);
  const score = scores.find((s) => s.id === id) ?? null;

  const handleSave = (updated: Score) => {
    const next = scores.map((s) => (s.id === updated.id ? updated : s));
    saveScores(next);
    setScores(next);
  };

  const handleDelete = () => {
    if (!confirm(`「${score!.title}」を削除しますか？`)) return;
    saveScores(scores.filter((s) => s.id !== id));
    router.push("/");
  };

  if (!score) {
    return (
      <div
        className="flex flex-col overflow-hidden"
        style={{ height: "100vh", background: "var(--bg)", color: "var(--t)" }}
      >
        <Header />
        <div
          className="flex-1 flex items-center justify-center text-sm"
          style={{ color: "var(--tm)" }}
        >
          スコアが見つかりません
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100vh", background: "var(--bg)", color: "var(--t)" }}
    >
      <Header
        breadcrumb={score.title}
        actions={
          <button
            onClick={handleDelete}
            className="text-[11px] px-2.5 py-1 rounded transition-all duration-[120ms] border border-transparent hover:bg-[rgba(255,68,102,.1)]"
            style={{ color: "var(--danger)" }}
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
