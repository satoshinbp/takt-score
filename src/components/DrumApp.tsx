"use client";

import { useState } from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { makeSamples, newScore, type Score } from "@/lib/constants";
import { loadScores, saveScores } from "@/lib/storage";
import { Dashboard } from "./Dashboard";
import { DetailPage } from "./DetailPage";
import { ScoreEditor } from "./ScoreEditor";

type Page = "dashboard" | "detail" | "create";

export function DrumApp() {
  const [scores, setScores] = useState<Score[]>(
    () => loadScores() ?? makeSamples(),
  );
  const [page, setPage] = useState<Page>("dashboard");
  const [selId, setSelId] = useState<string | null>(null);

  const sel = scores.find((s) => s.id === selId) ?? null;

  const persist = (next: Score[]) => {
    setScores(next);
    saveScores(next);
  };

  const handleSave = (updated: Score) => {
    const next = scores.some((s) => s.id === updated.id)
      ? scores.map((s) => (s.id === updated.id ? updated : s))
      : [...scores, updated];
    persist(next);
  };

  const handleSelect = (s: Score) => {
    setSelId(s.id);
    setPage("detail");
  };

  const handleCreate = () => {
    const fresh = newScore("New Score", 120);
    persist([...scores, fresh]);
    setSelId(fresh.id);
    setPage("create");
  };

  const handleBack = () => {
    setPage("dashboard");
    setSelId(null);
  };

  const handleDelete = (id: string) => {
    persist(scores.filter((s) => s.id !== id));
    handleBack();
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100vh", background: "var(--bg)", color: "var(--t)" }}
    >
      {/* Global header */}
      <Toolbar.Root asChild>
        <header
          className="flex items-center gap-3 px-5 flex-shrink-0 border-b z-[100]"
          style={{
            height: 50,
            background: "var(--s1)",
            borderColor: "var(--bd)",
          }}
        >
          <Toolbar.Button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[15px] font-bold tracking-[0.06em] flex-shrink-0"
            style={{
              color: "var(--acc)",
              fontFamily: "var(--font-space-grotesk), sans-serif",
            }}
          >
            <span className="text-lg">🥁</span>
            <span>DRUM MASTER</span>
          </Toolbar.Button>

          {page !== "dashboard" && (
            <span
              className="text-[11px] uppercase tracking-[0.06em]"
              style={{ color: "var(--tm)" }}
            >
              {page === "create" ? "新規作成" : (sel?.title ?? "Detail")}
            </span>
          )}

          {page === "detail" && sel && (
            <Toolbar.Button
              onClick={() => {
                if (confirm(`「${sel.title}」を削除しますか？`))
                  handleDelete(sel.id);
              }}
              className="ml-auto text-[11px] px-2.5 py-1 rounded transition-all duration-[120ms] border border-transparent text-[var(--danger)] hover:bg-[rgba(255,68,102,.1)]"
            >
              削除
            </Toolbar.Button>
          )}
        </header>
      </Toolbar.Root>

      {page === "dashboard" && (
        <Dashboard
          scores={scores}
          onSelect={handleSelect}
          onCreate={handleCreate}
        />
      )}

      {page === "detail" && sel && (
        <DetailPage
          key={selId}
          score={sel}
          onSave={handleSave}
          onBack={handleBack}
        />
      )}

      {page === "create" && sel && (
        <ScoreEditor
          key={`c${selId}`}
          score={sel}
          isNew
          onSave={(s) => {
            handleSave(s);
            setSelId(s.id);
            setPage("detail");
          }}
          onBack={() => {
            persist(scores.filter((s) => s.id !== selId));
            handleBack();
          }}
        />
      )}
    </div>
  );
}
