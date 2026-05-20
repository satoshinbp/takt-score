"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import BeatDots from "./_components/beat-dots";
import ConfigKnobs from "./_components/config-knobs";
import StatsPanel from "./_components/stats-panel";
import StatusBanner from "./_components/status-banner";
import TimingTrack from "./_components/timing-track";
import { type InnerTaktConfig, useInnerTakt } from "./_hooks/useInnerTakt";

const STORAGE_KEY = "taktscore_innertakt";

const DEFAULT_CFG: InnerTaktConfig = {
  bpm: 90,
  beatsPerBar: 4,
  accentEvery: 4,
  audibleBars: 4,
  silentBars: 4,
  fadeBeats: 1,
};

const InnerTakt = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<InnerTaktConfig>(DEFAULT_CFG);
  const [isHydrated, setIsHydrated] = useState(false);

  useLayoutEffect(() => {
    let savedCfg = DEFAULT_CFG;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw)
        savedCfg = {
          ...DEFAULT_CFG,
          ...(JSON.parse(raw) as Partial<InnerTaktConfig>),
        };
    } catch (_e) {
      void _e;
    }
    setConfig(savedCfg); // eslint-disable-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (_e) {
      void _e;
    }
  }, [config, isHydrated]);

  const update = <K extends keyof InnerTaktConfig>(
    key: K,
    val: InnerTaktConfig[K],
  ) => setConfig((prev) => ({ ...prev, [key]: val }));

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
  } = useInnerTakt(config);

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
          <div className="text-2xl font-extrabold tracking-wider">
            INNER TAKT
          </div>
          <div className="text-xs text-muted-foreground tracking-widest mt-1">
            {t("innerTakt.subtitle")}
          </div>
        </div>

        <StatusBanner
          isRunning={isRunning}
          isSilent={isSilent}
          cycleProgress={cycleProgress}
        />
        <BeatDots
          beatsPerBar={config.beatsPerBar}
          currentBeat={isRunning ? currentBeat : -1}
          accentEvery={config.accentEvery}
          isSilent={isSilent}
          fadeAmount={fadeAmount}
        />
        <TimingTrack taps={taps} />
        <StatsPanel taps={taps} />
        <ConfigKnobs config={config} update={update} />

        <div className="w-full flex items-center gap-2">
          {isRunning ? (
            <Button type="button" onClick={stop} size="lg" className="flex-1">
              <Square size={12} />
              {t("innerTakt.stop")}
            </Button>
          ) : (
            <Button type="button" onClick={start} size="lg" className="flex-1">
              <Play size={12} />
              {t("innerTakt.start")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={resetTaps}
            className="flex-1"
          >
            {t("innerTakt.resetTaps")}
          </Button>
          <span className="text-xs text-muted-foreground tracking-widest">
            {t("innerTakt.shortcutsHint")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InnerTakt;
