"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import BeatDots from "./_components/beat-dots";
import { Knob } from "./_components/knob";
import { StatsPanel } from "./_components/stats-panel";
import StatusBanner from "./_components/status-banner";
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
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="text-center">
          <div className="text-2xl font-extrabold tracking-wider text-zinc-100">
            INNER TAKT
          </div>
          <div className="text-xs text-muted-foreground tracking-widest mt-1">
            Rhythm Trainer · Tap &lt;SPACE&gt; on each beat
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

        <div className="w-full flex flex-wrap justify-center gap-6 bg-card p-6">
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
            accent="cyan"
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
            accent="cyan"
          />
          <Knob
            value={cfg.silentBars}
            min={1}
            max={16}
            step={1}
            onChange={(v) => update("silentBars", v)}
            label="SILENT"
            unit="bars"
            accent="red"
          />
          <Knob
            value={cfg.fadeBeats}
            min={0}
            max={8}
            step={0.5}
            onChange={(v) => update("fadeBeats", v)}
            label="FADE"
            unit="beats"
            accent="violet"
          />
        </div>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <Button type="button" onClick={stop} size="lg">
              <Square size={12} />
              Stop
            </Button>
          ) : (
            <Button type="button" onClick={start} size="lg">
              <Play size={12} />
              Start
            </Button>
          )}
          <Button type="button" variant="outline" onClick={resetTaps}>
            Reset Taps
          </Button>
          <span className="text-xs text-muted-foreground tracking-widest">
            SPACE: tap · ESC: stop · R: reset taps · scroll/drag knobs
          </span>
        </div>
      </div>
    </div>
  );
};

export default InnerTakt;
