"use client";

import { useState } from "react";
import { ArrowLeft, Music2 } from "lucide-react";
import SpotifyTrackDialog from "@/components/score-editor/spotify-track-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";

type Props = {
  onBack: () => void;
  title: string;
  onTitleChange: (t: string) => void;
  onSave: () => void;
  isNew: boolean;
  spotifyTrackId: string | null;
  onSpotifyTrackChange: (trackId: string | null) => void;
};

const ScoreEditorHeader = ({
  onBack,
  title,
  onTitleChange,
  onSave,
  isNew,
  spotifyTrackId,
  onSpotifyTrackChange,
}: Props) => {
  const { t } = useTranslation();
  const [isSpotifyOpen, setSpotifyOpen] = useState(false);
  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b border-border bg-background">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft size={12} />
        {t("scoreEditor.back")}
      </Button>
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t("scoreEditor.titlePlaceholder")}
      />
      <Button
        variant={spotifyTrackId ? "default" : "outline"}
        onClick={() => setSpotifyOpen(true)}
        title={
          spotifyTrackId
            ? t("spotifyEditor.changeTrack")
            : t("spotifyEditor.linkTrack")
        }
      >
        <Music2 size={12} />
      </Button>
      <Button onClick={onSave}>
        {isNew ? t("scoreEditor.create") : t("scoreEditor.save")}
      </Button>
      <SpotifyTrackDialog
        open={isSpotifyOpen}
        onOpenChange={setSpotifyOpen}
        currentTrackId={spotifyTrackId}
        onSelect={onSpotifyTrackChange}
      />
    </div>
  );
};

export default ScoreEditorHeader;
