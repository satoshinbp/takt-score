"use client";

import { useRef, useState } from "react";
import { Loader2, Music, Upload } from "lucide-react";
import type {
  GenerateRequest,
  GenerateResponse,
} from "@/app/api/ai/generate/route";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { detectBpm } from "@/lib/detect-bpm";
import type { Measure } from "@/types/common";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (measures: Measure[], bpm: number) => void;
};

const GENRES = [
  "rock",
  "pop",
  "jazz",
  "funk",
  "metal",
  "blues",
  "latin",
  "other",
] as const;
const GENRE_LABELS: Record<(typeof GENRES)[number], string | null> = {
  rock: "Rock",
  pop: "Pop",
  jazz: "Jazz",
  funk: "Funk",
  metal: "Metal",
  blues: "Blues",
  latin: "Latin",
  other: null,
};

const AiGenerateDialog = ({ open, onOpenChange, onGenerate }: Props) => {
  const { t } = useTranslation();
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState<string>("");
  const [measureCount, setMeasureCount] = useState("4");
  const [requests, setRequests] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFileName(file.name);
    setIsDetecting(true);
    setError("");
    try {
      const detected = await detectBpm(file);
      setBpm(String(detected));
    } catch {
      setError(t("aiDialog.bpmDetectFailed"));
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!songTitle.trim()) return;
    setIsGenerating(true);
    setError("");

    const body: GenerateRequest = {
      songTitle: songTitle.trim(),
      artist: artist.trim() || undefined,
      genre: genre || undefined,
      bpm: bpm ? Number(bpm) : undefined,
      measureCount: Math.max(1, Math.min(8, Number(measureCount) || 4)),
      requests: requests.trim() || undefined,
    };

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as GenerateResponse & { error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? t("aiDialog.generateFailed"));
        return;
      }
      onGenerate(json.measures, json.bpm);
      onOpenChange(false);
    } catch {
      setError(t("aiDialog.networkError"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music size={16} />
            {t("aiDialog.title")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="song-title">{t("aiDialog.songTitle")}</Label>
            <Input
              id="song-title"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="In the Air Tonight"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="artist">{t("aiDialog.artist")}</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Phil Collins"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>{t("aiDialog.genre")}</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder={t("aiDialog.genrePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {GENRE_LABELS[g] ?? t("aiDialog.genreOther")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 w-20">
              <Label htmlFor="measure-count">
                {t("aiDialog.measureCount")}
              </Label>
              <Input
                id="measure-count"
                type="number"
                min={1}
                max={8}
                value={measureCount}
                onChange={(e) => setMeasureCount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("aiDialog.audioFile")}</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isDetecting}
                className="shrink-0"
              >
                {isDetecting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                {isDetecting
                  ? t("aiDialog.detecting")
                  : t("aiDialog.selectFile")}
              </Button>
              <span className="text-xs text-muted-foreground truncate">
                {audioFileName || t("aiDialog.filePlaceholder")}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => void handleFileChange(e)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bpm">BPM</Label>
            <Input
              id="bpm"
              type="number"
              min={30}
              max={300}
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="120"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requests">{t("aiDialog.requests")}</Label>
            <Textarea
              id="requests"
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              placeholder={t("aiDialog.requestsPlaceholder")}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              {t("aiDialog.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!songTitle.trim() || isGenerating || isDetecting}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  {t("aiDialog.generating")}
                </>
              ) : (
                t("aiDialog.generate")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AiGenerateDialog;
