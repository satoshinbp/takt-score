"use client";

import type { Score } from "@/lib/constants";
import { Button } from "@radix-ui/themes";
import { ScorePreview } from "./ScorePreview";

type Props = {
  scores: Score[];
  onSelect: (s: Score) => void;
  onCreate: () => void;
};

export function Dashboard({ scores, onSelect, onCreate }: Props) {
  return (
    <div
      className="page-fade flex flex-col flex-1 overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-end px-6 pt-9 pb-5">
          <div>
            <div
              className="text-[26px] font-bold"
              style={{ letterSpacing: "-0.02em" }}
            >
              My Scores
            </div>
            <div className="text-[13px] mt-0.5" style={{ color: "var(--tm)" }}>
              {scores.length}件
            </div>
          </div>
          <Button
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-[120ms]"
            style={{ background: "var(--acc)", color: "#09090c" }}
          >
            ＋ 新規作成
          </Button>
        </div>

        {/* Grid */}
        <div
          className="grid gap-2.5 px-6 pb-10"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          }}
        >
          {scores.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelect(s)}
              className="rounded-[10px] p-4 cursor-pointer transition-all duration-[140ms] relative overflow-hidden"
              style={{ background: "var(--s1)", border: "1px solid var(--bd)" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--bd2)";
                el.style.background = "var(--s2)";
                el.style.transform = "translateY(-1px)";
                el.style.boxShadow = "0 4px 20px rgba(0,0,0,.4)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--bd)";
                el.style.background = "var(--s1)";
                el.style.transform = "";
                el.style.boxShadow = "";
              }}
            >
              <ScorePreview measures={s.measures} />
              <div className="text-[15px] font-semibold truncate">
                {s.title}
              </div>
              <div className="flex gap-1.5 mt-2">
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "var(--s2)",
                    color: "var(--tm)",
                    letterSpacing: "0.03em",
                  }}
                >
                  {s.bpm} BPM
                </span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "var(--s2)",
                    color: "var(--tm)",
                    letterSpacing: "0.03em",
                  }}
                >
                  {s.measures.length}小節
                </span>
              </div>
            </div>
          ))}

          {/* New card */}
          <div
            onClick={onCreate}
            className="rounded-[10px] p-4 cursor-pointer transition-all duration-[140ms] flex flex-col items-center justify-center gap-1.5 min-h-[130px]"
            style={{
              border: "1px dashed var(--bd)",
              color: "var(--tm)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.color = "var(--t)";
              el.style.borderColor = "var(--acc)";
              el.style.background = "var(--acc-d)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.color = "var(--tm)";
              el.style.borderColor = "var(--bd)";
              el.style.background = "";
            }}
          >
            <div className="text-[22px] leading-none">＋</div>
            <div className="text-xs font-medium">新規ドラム譜</div>
          </div>
        </div>
      </div>
    </div>
  );
}
