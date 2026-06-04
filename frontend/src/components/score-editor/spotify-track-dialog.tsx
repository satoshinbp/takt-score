"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, LogIn, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { searchTracks, type SpotifyTrack } from "@/lib/spotify/api";
import { SPOTIFY_CLIENT_ID } from "@/lib/spotify/config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTrackId: string | null;
  onSelect: (trackId: string | null) => void;
};

const SpotifyTrackDialog = ({
  open,
  onOpenChange,
  currentTrackId,
  onSelect,
}: Props) => {
  const { t } = useTranslation();
  const { isAuthed, login, logout, ensureToken } = useSpotifyAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Monotonic request counter — only the latest search may publish its
  // result/loading/error to state. Without this guard, rapid consecutive
  // searches could let an older response overwrite a newer one.
  const latestReqIdRef = useRef(0);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery("");
      setResults([]);
      setError(null);
      latestReqIdRef.current++;
    }
    onOpenChange(next);
  };

  const runSearch = async (q: string) => {
    const reqId = ++latestReqIdRef.current;
    const isLatest = () => reqId === latestReqIdRef.current;

    setError(null);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const token = await ensureToken();
    if (!isLatest()) return;
    if (!token) {
      setError(t("spotifyDialog.notAuthed"));
      return;
    }
    setLoading(true);
    try {
      const items = await searchTracks(q);
      if (isLatest()) setResults(items);
    } catch (e) {
      if (isLatest()) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (isLatest()) setLoading(false);
    }
  };

  if (!SPOTIFY_CLIENT_ID) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("spotifyDialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {t("spotifyDialog.missingClientId")}
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("spotifyDialog.title")}</DialogTitle>
        </DialogHeader>

        {!isAuthed ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              {t("spotifyDialog.loginPrompt")}
            </p>
            <Button onClick={() => void login()} className="self-start">
              <LogIn size={12} /> {t("spotifyDialog.login")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void runSearch(query);
              }}
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("spotifyDialog.searchPlaceholder")}
              />
              <Button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Search size={12} />
                )}
              </Button>
            </form>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <ul className="flex max-h-72 flex-col overflow-auto divide-y divide-border">
              {results.map((track) => {
                const isSelected = track.id === currentTrackId;
                return (
                  <li key={track.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(track.id);
                        onOpenChange(false);
                      }}
                      className={
                        "flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-accent" +
                        (isSelected ? " bg-accent" : "")
                      }
                    >
                      {track.albumImageUrl ? (
                        <Image
                          src={track.albumImageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="rounded-sm"
                          unoptimized
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-sm bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">
                          {track.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {track.artists.join(", ")}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between pt-2">
              {currentTrackId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onSelect(null);
                    onOpenChange(false);
                  }}
                >
                  {t("spotifyDialog.unlink")}
                </Button>
              ) : (
                <span />
              )}
              <Button type="button" variant="ghost" onClick={logout}>
                <LogOut size={12} /> {t("spotifyDialog.logout")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SpotifyTrackDialog;
