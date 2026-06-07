"use client";

import {
  Drum,
  Loader2,
  LogIn,
  Music2,
  Pause,
  Play,
  Repeat,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { useTranslation } from "@/hooks/useTranslation";
import { decodeStep, getTotalSteps } from "@/lib/playback-utils";
import type { Measure } from "@/types/common";

export type PlaybackMode = "drum" | "spotify";

// Spotify command surface the viewer hands to Transport. Present only when the
// score has a linked track and the page wired up a Web Playback SDK player.
export type SpotifyTransport = {
  isAuthed: boolean;
  isReady: boolean;
  isPlaying: boolean;
  errorMessage: string | null;
  trackLabel: string | null;
  onToggle: () => void;
  onLogin: () => void;
};

type TransportProps = {
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  loop: boolean;
  measures: Measure[];
  onToggle: () => void;
  onStop: () => void;
  onBpmChange: (v: number) => void;
  onSeek: (step: number) => void;
  onLoopToggle: () => void;
  // Mode controls are optional: without a linked Spotify track the page omits
  // them and Transport renders drum-only, exactly as before.
  playbackMode?: PlaybackMode;
  onPlaybackModeChange?: (mode: PlaybackMode) => void;
  spotify?: SpotifyTransport;
};

const Transport = ({
  isPlaying,
  currentStep,
  bpm,
  loop,
  measures,
  onToggle,
  onStop,
  onBpmChange,
  onSeek,
  onLoopToggle,
  playbackMode,
  onPlaybackModeChange,
  spotify,
}: TransportProps) => {
  const { t } = useTranslation();
  const totalSteps = getTotalSteps(measures);
  const { measureIndex: currentMeasure, beatIndex: currentBeat } =
    currentStep >= 0
      ? decodeStep(currentStep, measures)
      : { measureIndex: -1, beatIndex: -1 };

  const canSelectMode = !!spotify && !!playbackMode && !!onPlaybackModeChange;
  // Spotify exposes no tempo control and the loop/seek/step indicator are
  // drum-only concepts, so those controls are disabled while in Spotify mode.
  const isSpotify = canSelectMode && playbackMode === "spotify";

  const renderSpotifyControl = () => {
    if (!spotify) return null;
    if (!spotify.isAuthed) {
      return (
        <Button type="button" size="sm" onClick={spotify.onLogin}>
          <LogIn size={12} /> {t("scoreViewer.spotifyConnect")}
        </Button>
      );
    }
    if (!spotify.isReady) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          {t("scoreViewer.spotifyDeviceWaiting")}
        </span>
      );
    }
    return (
      <Toggle
        pressed={spotify.isPlaying}
        onPressedChange={spotify.onToggle}
        title={
          spotify.isPlaying
            ? t("scoreViewer.spotifyPause")
            : t("scoreViewer.spotifyPlay")
        }
      >
        {spotify.isPlaying ? <Pause size={12} /> : <Play size={12} />}
      </Toggle>
    );
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t bg-card">
      {canSelectMode && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Drum
            size={14}
            className={isSpotify ? "text-muted-foreground" : "text-foreground"}
          />
          <Switch
            checked={isSpotify}
            onCheckedChange={(checked) =>
              onPlaybackModeChange?.(checked ? "spotify" : "drum")
            }
            aria-label={
              isSpotify ? t("transport.modeSpotify") : t("transport.modeDrum")
            }
          />
          <Music2
            size={14}
            className={isSpotify ? "text-foreground" : "text-muted-foreground"}
          />
        </div>
      )}

      {isSpotify ? (
        renderSpotifyControl()
      ) : (
        <>
          <Toggle
            pressed={isPlaying}
            onPressedChange={onToggle}
            title={isPlaying ? t("transport.pause") : t("transport.play")}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </Toggle>
          <Button
            type="button"
            variant="ghost"
            onClick={onStop}
            size="icon"
            title={t("transport.stop")}
          >
            <Square size={12} />
          </Button>
        </>
      )}

      {isSpotify ? (
        <span
          className={
            spotify?.errorMessage
              ? "flex-1 truncate text-xs text-destructive"
              : "flex-1 truncate text-xs text-muted-foreground"
          }
        >
          {spotify?.errorMessage
            ? `${t("scoreViewer.spotifyError")}: ${spotify.errorMessage}`
            : spotify?.trackLabel}
        </span>
      ) : (
        <>
          <span className="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground">
            {currentStep >= 0
              ? `M${String(currentMeasure + 1).padStart(2, "0")} / B${currentBeat + 1}`
              : "M-- / B--"}
          </span>
          <Input
            type="range"
            min={0}
            max={totalSteps - 1}
            value={Math.max(0, currentStep)}
            onChange={(e) => onSeek(+e.target.value)}
          />
        </>
      )}

      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
        <span>BPM</span>
        <Input
          type="number"
          value={bpm}
          min={30}
          max={300}
          disabled={isSpotify}
          onChange={(e) => onBpmChange(+e.target.value)}
          onBlur={(e) =>
            onBpmChange(Math.max(30, Math.min(300, +e.target.value)))
          }
        />
      </div>
      <Toggle
        pressed={loop}
        onPressedChange={onLoopToggle}
        disabled={isSpotify}
        title={t("transport.loop")}
      >
        <Repeat size={12} />
      </Toggle>
    </div>
  );
};

export default Transport;
