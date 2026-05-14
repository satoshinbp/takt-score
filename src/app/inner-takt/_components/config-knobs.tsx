"use client";

import Knob from "@/components/knob";
import type { InnerTaktConfig } from "../_hooks/useInnerTakt";

type Props = {
  config: InnerTaktConfig;
  update: <K extends keyof InnerTaktConfig>(
    key: K,
    val: InnerTaktConfig[K]
  ) => void;
};

const ConfigKnobs = ({ config, update }: Props) => {
  return (
    <div className="w-full flex flex-wrap justify-center gap-6 bg-card p-6">
      <Knob
        value={config.bpm}
        min={40}
        max={240}
        step={1}
        onChange={(v) => update("bpm", v)}
        label="BPM"
      />
      <Knob
        value={config.beatsPerBar}
        min={2}
        max={8}
        step={1}
        onChange={(v) => {
          update("beatsPerBar", v);
          if (config.accentEvery > v) update("accentEvery", v);
        }}
        label="BEATS / BAR"
        accent="regular-beat"
      />
      <Knob
        value={config.accentEvery}
        min={1}
        max={config.beatsPerBar}
        step={1}
        onChange={(v) => update("accentEvery", v)}
        label="ACCENT"
        unit={`every ${config.accentEvery} beat${config.accentEvery > 1 ? "s" : ""}`}
      />
      <Knob
        value={config.audibleBars}
        min={1}
        max={16}
        step={1}
        onChange={(v) => update("audibleBars", v)}
        label="AUDIBLE"
        unit="bars"
        accent="regular-beat"
      />
      <Knob
        value={config.silentBars}
        min={1}
        max={16}
        step={1}
        onChange={(v) => update("silentBars", v)}
        label="SILENT"
        unit="bars"
        accent="red"
      />
      <Knob
        value={config.fadeBeats}
        min={0}
        max={8}
        step={0.5}
        onChange={(v) => update("fadeBeats", v)}
        label="FADE"
        unit="beats"
        accent="violet"
      />
    </div>
  );
};

export default ConfigKnobs;
