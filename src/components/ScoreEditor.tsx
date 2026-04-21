"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { PARTS, cloneMeasure, emptyMeasure, type Score } from "@/lib/constants";
import { usePlayback } from "@/hooks/usePlayback";
import { DrumGrid } from "./DrumGrid";
import { Transport } from "./Transport";

type Props = {
  score: Score;
  isNew?: boolean;
  onSave: (s: Score) => void;
  onBack: () => void;
};

export function ScoreEditor({ score, isNew = false, onSave, onBack }: Props) {
  const [draft, setDraft] = useState<Score>(() => ({
    ...score,
    measures: score.measures.map(cloneMeasure),
  }));
  const [sel, setSel] = useState<number[]>([]);
  const [clip, setClip] = useState<ReturnType<typeof cloneMeasure>[] | null>(null);
  const pb = usePlayback(draft);

  const prevBpm = useRef(pb.bpm);
  useEffect(() => {
    if (pb.bpm !== prevBpm.current) {
      setDraft((d) => ({ ...d, bpm: pb.bpm }));
      prevBpm.current = pb.bpm;
    }
  }, [pb.bpm]);

  const handleToggle = useCallback((mi: number, partIdx: number, si: number) => {
    const partId = PARTS[partIdx].id;
    setDraft((d) => {
      const ms = d.measures.map(cloneMeasure);
      ms[mi][partId][si] = ms[mi][partId][si] ? 0 : 1;
      return { ...d, measures: ms };
    });
  }, []);

  const toggleSel = (mi: number) =>
    setSel((s) => (s.includes(mi) ? s.filter((i) => i !== mi) : [...s, mi]));

  const addBlank = () =>
    setDraft((d) => ({ ...d, measures: [...d.measures, emptyMeasure()] }));

  const addDupe = () => {
    const src =
      sel.length
        ? draft.measures[sel[sel.length - 1]]
        : draft.measures[draft.measures.length - 1];
    setDraft((d) => ({ ...d, measures: [...d.measures, cloneMeasure(src)] }));
  };

  const copyMeas = () => {
    if (!sel.length) return;
    setClip(
      [...sel].sort((a, b) => a - b).map((i) => cloneMeasure(draft.measures[i]))
    );
  };

  const pasteMeas = () => {
    if (!clip) return;
    const at = sel.length ? Math.max(...sel) + 1 : draft.measures.length;
    setDraft((d) => {
      const ms = [...d.measures];
      ms.splice(at, 0, ...clip.map(cloneMeasure));
      return { ...d, measures: ms };
    });
  };

  const clearMeas = () => {
    if (!sel.length) return;
    setDraft((d) => ({
      ...d,
      measures: d.measures.map((m, i) => (sel.includes(i) ? emptyMeasure() : cloneMeasure(m))),
    }));
  };

  const delMeas = () => {
    if (draft.measures.length <= 1 || !sel.length) return;
    const s = new Set(sel);
    setDraft((d) => ({ ...d, measures: d.measures.filter((_, i) => !s.has(i)) }));
    setSel([]);
  };

  const handleSave = () => onSave({ ...draft, updatedAt: Date.now() });

  const selSorted = [...sel].sort((a, b) => a - b);

  return (
    <div
      className="page-fade flex flex-col h-full overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-2.5 px-[18px] py-2 flex-shrink-0 border-b"
        style={{ background: "var(--s1)", borderColor: "var(--bd)" }}
      >
        <button
          onClick={() => { pb.stop(); onBack(); }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-[120ms] bg-transparent border border-[var(--bd)] text-[var(--td)] hover:bg-[var(--s2)] hover:text-[var(--t)]"
        >
          ← 戻る
        </button>
        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="タイトル..."
          className="text-[17px] font-semibold flex-1 min-w-0 px-1.5 py-0.5 rounded"
          style={{
            background: "transparent",
            border: "1px solid transparent",
            color: "var(--t)",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--bd)";
            e.currentTarget.style.background = "var(--s2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.background = "transparent";
          }}
        />
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-[120ms]"
          style={{ background: "var(--acc)", color: "#09090c" }}
        >
          {isNew ? "作成" : "保存"}
        </button>
      </div>

      {/* Toolbar */}
      <Toolbar.Root
        className="flex items-center gap-1.5 px-[18px] py-1.5 flex-shrink-0 border-b flex-wrap min-h-[42px]"
        style={{ background: "var(--s1)", borderColor: "var(--bd)" }}
      >
        <span
          className="text-[10px] uppercase mr-0.5"
          style={{ color: "var(--tm)", letterSpacing: "0.05em" }}
        >
          追加
        </span>
        <GhostBtn sm onClick={addBlank}>＋ 空の小節</GhostBtn>
        <GhostBtn sm onClick={addDupe}>
          {sel.length ? "⊕ 選択を複製" : "⊕ 末尾を複製"}
        </GhostBtn>
        <Toolbar.Separator className="w-px h-[18px] flex-shrink-0" style={{ background: "var(--bd)" }} />

        <span
          className="text-[10px] uppercase mr-0.5"
          style={{ color: "var(--tm)", letterSpacing: "0.05em" }}
        >
          選択操作
        </span>

        {sel.length === 0 ? (
          <span className="text-[11px] flex items-center gap-1 px-1" style={{ color: "var(--tm)" }}>
            <span style={{ opacity: 0.6 }}>↓</span> 下のM番号をクリックして小節を選択
          </span>
        ) : (
          <>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded"
              style={{
                color: "var(--acc)",
                background: "var(--acc-d)",
                border: "1px solid rgba(245,200,66,.25)",
              }}
            >
              M{selSorted.map((i) => i + 1).join(", ")} 選択中
            </span>
            <GhostBtn sm onClick={copyMeas}>📋 コピー</GhostBtn>
            {clip && (
              <GhostBtn sm onClick={pasteMeas}>
                📌 貼り付け ({clip.length})
              </GhostBtn>
            )}
            <GhostBtn sm onClick={clearMeas}>🗑 クリア</GhostBtn>
            <DangerBtn sm onClick={delMeas} disabled={draft.measures.length <= 1}>
              ✕ 削除
            </DangerBtn>
            <GhostBtn sm onClick={() => setSel([])}>解除</GhostBtn>
          </>
        )}

        {clip && sel.length === 0 && (
          <>
            <Toolbar.Separator className="w-px h-[18px] flex-shrink-0" style={{ background: "var(--bd)" }} />
            <GhostBtn sm onClick={pasteMeas}>
              📌 貼り付け ({clip.length})
            </GhostBtn>
          </>
        )}
      </Toolbar.Root>

      {/* Grid */}
      <div className="flex-1 overflow-auto px-[18px] py-3.5 pb-2.5">
        <DrumGrid
          measures={draft.measures}
          currentStep={pb.currentStep}
          onToggle={handleToggle}
          mode="edit"
          selMeasures={sel}
          onSelMeasure={toggleSel}
        />
      </div>

      <Transport
        isPlaying={pb.isPlaying}
        onToggle={pb.toggle}
        bpm={pb.bpm}
        onBpmChange={pb.setBpm}
        loop={pb.loop}
        onLoopToggle={() => pb.setLoop((l) => !l)}
        currentMeasure={pb.currentMeasure}
        currentBeat={pb.currentBeat}
      />
    </div>
  );
}

const GhostBtn = ({
  children,
  onClick,
  disabled,
  sm,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  sm?: boolean;
}) => (
  <Toolbar.Button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1 rounded font-medium transition-all duration-[120ms] whitespace-nowrap disabled:opacity-35 disabled:pointer-events-none bg-transparent border border-[var(--bd)] text-[var(--td)] hover:bg-[var(--s2)] hover:text-[var(--t)] hover:border-[var(--bd2)]"
    style={{ padding: sm ? "4px 10px" : "5px 13px", fontSize: sm ? 11 : 12 }}
  >
    {children}
  </Toolbar.Button>
);

const DangerBtn = ({
  children,
  onClick,
  disabled,
  sm,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  sm?: boolean;
}) => (
  <Toolbar.Button
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1 rounded font-medium transition-all duration-[120ms] whitespace-nowrap disabled:opacity-30 disabled:pointer-events-none bg-transparent border border-transparent text-[var(--danger)] hover:bg-[rgba(255,68,102,.1)]"
    style={{ padding: sm ? "4px 10px" : "5px 13px", fontSize: sm ? 11 : 12 }}
  >
    {children}
  </Toolbar.Button>
);
