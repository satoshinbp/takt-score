"use client";

import Knob from "@/components/knob";
import { useTranslation } from "@/hooks/useTranslation";
import type { InnerTaktConfig } from "../_hooks/useInnerTakt";

type Props = {
  config: InnerTaktConfig;
  update: <K extends keyof InnerTaktConfig>(
    key: K,
    val: InnerTaktConfig[K],
  ) => void;
};

const ConfigKnobs = ({ config, update }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-wrap justify-center gap-6 bg-card p-6 border">
      <Knob
        value={config.bpm}
        min={40}
        max={240}
        step={1}
        onChange={(v) => update("bpm", v)}
        label={t("innerTakt.knob.bpm")}
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
        label={t("innerTakt.knob.beatsPerBar")}
        accent="chart-regular"
      />
      <Knob
        value={config.accentEvery}
        min={1}
        max={config.beatsPerBar}
        step={1}
        onChange={(v) => update("accentEvery", v)}
        label={t("innerTakt.knob.accent")}
        unit={t(
          config.accentEvery === 1
            ? "innerTakt.knob.accentUnitOne"
            : "innerTakt.knob.accentUnitOther",
          { count: config.accentEvery },
        )}
      />
      <Knob
        value={config.audibleBars}
        min={1}
        max={16}
        step={1}
        onChange={(v) => update("audibleBars", v)}
        label={t("innerTakt.knob.audible")}
        unit={t("innerTakt.unit.bars")}
        accent="chart-regular"
      />
      <Knob
        value={config.silentBars}
        min={1}
        max={16}
        step={1}
        onChange={(v) => update("silentBars", v)}
        label={t("innerTakt.knob.silent")}
        unit={t("innerTakt.unit.bars")}
        accent="red"
      />
      <Knob
        value={config.fadeBeats}
        min={0}
        max={8}
        step={0.5}
        onChange={(v) => update("fadeBeats", v)}
        label={t("innerTakt.knob.fade")}
        unit={t("innerTakt.unit.beats")}
        accent="violet"
      />
    </div>
  );
};

export default ConfigKnobs;
