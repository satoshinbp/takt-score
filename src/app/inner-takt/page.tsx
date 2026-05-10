"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { BeatDots } from "./_components/beat-dots";
import { Knob } from "./_components/knob";
import { StatsPanel } from "./_components/stats-panel";
import { StatusBanner } from "./_components/status-banner";
import { TimingTrack } from "./_components/timing-track";
import { type InnerTaktCfg, useInnerTakt } from "./_hooks/useInnerTakt";

const STORAGE_KEY = "taktscore_innertakt";

const DEFAULT_CFG: InnerTaktCfg = {
  bpm: 90,
  beatsPerBar: 4,
  accentEvery: 4,
  audibleBars: 4,
  silentBars: 4,
  fadeBeats: 1,
};

const InnerTakt = () => {
  const [cfg, setCfg] = useState<InnerTaktCfg>(DEFAULT_CFG);
  const [isHydrated, setIsHydrated] = useState(false);

  useLayoutEffect(() => {
    let savedCfg = DEFAULT_CFG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw)
        savedCfg = {
          ...DEFAULT_CFG,
          ...(JSON.parse(raw) as Partial<InnerTaktCfg>),
        };
    } catch (_e) {
      void _e;
    }
    setCfg(savedCfg); // eslint-disable-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (_e) {
      void _e;
    }
  }, [cfg, isHydrated]);

  const update = <K extends keyof InnerTaktCfg>(key: K, val: InnerTaktCfg[K]) =>
    setCfg((prev) => ({ ...prev, [key]: val }));

  const {
    isRunning,
    currentBeat,
    isSilent,
    fadeAmount,
    taps,
    cycleProgress,
    start,
    stop,
    recordTap,
    resetTaps,
  } = useInnerTakt(cfg);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (e.repeat) return;
        if (!isRunning) {
          start();
          return;
        }
        recordTap();
      } else if (e.code === "KeyR") {
        resetTaps();
      } else if (e.code === "Escape") {
        stop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, start, stop, recordTap, resetTaps]);

  return (
    <div
      className="flex-1 overflow-auto bg-zinc-950 text-zinc-200"
      style={{ background: "#0a0a12" }}
    >
      <div className="flex flex-col items-center gap-7 px-6 py-8">
        <div className="text-center">
          <div className="text-[22px] font-extrabold tracking-[0.04em] text-zinc-100">
            INNER TAKT
          </div>
          <div className="text-[10px] tracking-[0.14em] text-zinc-600 mt-1">
            RHYTHM TRAINER · TAP &lt;SPACE&gt; ON EACH BEAT
          </div>
        </div>

        <StatusBanner
          isRunning={isRunning}
          isSilent={isSilent}
          cycleProgress={cycleProgress}
        />

        <BeatDots
          beatsPerBar={cfg.beatsPerBar}
          currentBeat={isRunning ? currentBeat : -1}
          accentEvery={cfg.accentEvery}
          isSilent={isSilent}
          fadeAmount={fadeAmount}
        />

        <TimingTrack taps={taps} />
        <StatsPanel taps={taps} />

        <div
          className="flex flex-wrap justify-center gap-7 rounded-2xl border border-zinc-800 px-7 py-6 max-w-[720px]"
          style={{ background: "#0e0d18" }}
        >
          <Knob
            value={cfg.bpm}
            min={40}
            max={240}
            step={1}
            onChange={(v) => update("bpm", v)}
            label="BPM"
          />
          <Knob
            value={cfg.beatsPerBar}
            min={2}
            max={8}
            step={1}
            onChange={(v) => {
              update("beatsPerBar", v);
              if (cfg.accentEvery > v) update("accentEvery", v);
            }}
            label="BEATS / BAR"
            accent="#22d3ee"
          />
          <Knob
            value={cfg.accentEvery}
            min={1}
            max={cfg.beatsPerBar}
            step={1}
            onChange={(v) => update("accentEvery", v)}
            label="ACCENT"
            unit={`every ${cfg.accentEvery} beat${cfg.accentEvery > 1 ? "s" : ""}`}
          />
          <Knob
            value={cfg.audibleBars}
            min={1}
            max={16}
            step={1}
            onChange={(v) => update("audibleBars", v)}
            label="AUDIBLE"
            unit="bars"
            accent="#22d3ee"
          />
          <Knob
            value={cfg.silentBars}
            min={1}
            max={16}
            step={1}
            onChange={(v) => update("silentBars", v)}
            label="SILENT"
            unit="bars"
            accent="#ef4444"
          />
          <Knob
            value={cfg.fadeBeats}
            min={0}
            max={8}
            step={0.5}
            onChange={(v) => update("fadeBeats", v)}
            label="FADE"
            unit="beats"
            accent="#a78bfa"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={isRunning ? stop : start}
            className="rounded-lg px-8 py-3 text-xs font-extrabold tracking-[0.14em] text-white"
            style={{
              background: isRunning ? "#ef4444" : "#f97316",
              boxShadow: isRunning
                ? "0 0 20px rgba(239, 68, 68, 0.4)"
                : "0 0 20px rgba(249, 115, 22, 0.33)",
            }}
          >
            {isRunning ? "■ STOP" : "▶ START"}
          </button>
          <button
            type="button"
            onClick={resetTaps}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3 text-[11px] font-bold tracking-[0.12em] text-zinc-400"
          >
            RESET TAPS
          </button>
          <span className="ml-3 text-[9px] tracking-[0.1em] text-zinc-600">
            SPACE: tap · ESC: stop · R: reset taps · scroll/drag knobs
          </span>
        </div>
      </div>
    </div>
  );
};

export default InnerTakt;
