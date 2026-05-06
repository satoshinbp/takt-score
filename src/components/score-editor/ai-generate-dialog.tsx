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
import type { Measure } from "@/lib/constants";
import { detectBpm } from "@/lib/detect-bpm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (measures: Measure[], bpm: number) => void;
};

const GENRES = [
  { value: "rock", label: "Rock" },
  { value: "pop", label: "Pop" },
  { value: "jazz", label: "Jazz" },
  { value: "funk", label: "Funk" },
  { value: "metal", label: "Metal" },
  { value: "blues", label: "Blues" },
  { value: "latin", label: "Latin" },
  { value: "other", label: "その他" },
];

const AiGenerateDialog = ({ open, onOpenChange, onGenerate }: Props) => {
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
      setError("BPM の検出に失敗しました。手動で入力してください。");
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
        setError(json.error ?? "生成に失敗しました");
        return;
      }
      onGenerate(json.measures, json.bpm);
      onOpenChange(false);
    } catch {
      setError("ネットワークエラーが発生しました");
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
            AI で譜面を生成
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="song-title">曲名 *</Label>
            <Input
              id="song-title"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="In the Air Tonight"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="artist">アーティスト</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Phil Collins"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>ジャンル</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="選択…" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 w-20">
              <Label htmlFor="measure-count">小節数</Label>
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
            <Label>音声ファイル（BPM 自動検出）</Label>
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
                {isDetecting ? "検出中…" : "選択"}
              </Button>
              <span className="text-xs text-muted-foreground truncate">
                {audioFileName || "MP3 / WAV など"}
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
            <Label htmlFor="requests">追加リクエスト</Label>
            <Textarea
              id="requests"
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              placeholder="初心者向け、ハーフタイム、フィル多めなど"
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
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!songTitle.trim() || isGenerating || isDetecting}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  生成中…
                </>
              ) : (
                "生成する"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AiGenerateDialog;
