"use client";

import { Loader2, LogIn, Music2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  isAuthed: boolean;
  isReady: boolean;
  isPlaying: boolean;
  errorMessage: string | null;
  hasTrack: boolean;
  trackLabel: string | null;
  onLogin: () => void;
  onToggle: () => void;
};

const SpotifyBar = ({
  isAuthed,
  isReady,
  isPlaying,
  errorMessage,
  hasTrack,
  trackLabel,
  onLogin,
  onToggle,
}: Props) => {
  const { t } = useTranslation();

  if (!hasTrack) {
    return (
      <div className="flex items-center gap-2 border-b bg-card px-4 py-1.5 text-xs text-muted-foreground">
        <Music2 size={12} />
        <span>{t("scoreViewer.spotifyNoTrack")}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-b bg-card px-4 py-1.5 text-xs">
      <Music2 size={12} className="text-muted-foreground" />
      {trackLabel && (
        <span className="truncate text-muted-foreground">{trackLabel}</span>
      )}
      <span className="flex-1" />
      {errorMessage && (
        <span className="text-destructive">
          {t("scoreViewer.spotifyError")}: {errorMessage}
        </span>
      )}
      {!isAuthed ? (
        <Button size="sm" onClick={onLogin}>
          <LogIn size={12} /> {t("scoreViewer.spotifyConnect")}
        </Button>
      ) : !isReady ? (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          {t("scoreViewer.spotifyDeviceWaiting")}
        </span>
      ) : (
        <Button size="sm" onClick={onToggle}>
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          {isPlaying
            ? t("scoreViewer.spotifyPause")
            : t("scoreViewer.spotifyPlay")}
        </Button>
      )}
    </div>
  );
};

export default SpotifyBar;
