"use client";

import { useCallback, useEffect, useState } from "react";
import ScoreGrid from "@/components/score-grid";
import ScoreViewerHeader from "@/components/score-viewer/header";
import SpotifyBar from "@/components/score-viewer/spotify-bar";
import Transport from "@/components/transport";
import { usePlayback } from "@/hooks/usePlayback";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { getTrack } from "@/lib/spotify/api";
import type { ScoreDetail } from "@/types/common";

type Props = {
  score: ScoreDetail;
  onEdit: () => void;
  onBack: () => void;
  onDelete?: () => void;
};

// Spotify playback and the local drum playback are intentionally decoupled:
// each Transport controls only its own engine. The two never mirror or sync
// state. SpotifyBar just exposes Spotify's own play/pause, and Transport drives
// the in-browser drum scheduler.
const ScoreViewer = ({ score, onEdit, onBack, onDelete }: Props) => {
  const pb = usePlayback(score);
  const trackId = score.spotifyTrackId;
  const auth = useSpotifyAuth();
  const player = useSpotifyPlayer();

  const [trackLabel, setTrackLabel] = useState<string | null>(null);

  const shouldFetchTrack = !!trackId && auth.isAuthed;

  // Pull track metadata when the user is signed in and the score has a linked
  // track. Used only to label the SpotifyBar; failures are silent.
  useEffect(() => {
    if (!shouldFetchTrack || !trackId) return;
    let isCancelled = false;
    void (async () => {
      try {
        const track = await getTrack(trackId);
        if (!isCancelled) {
          setTrackLabel(`${track.name} — ${track.artists.join(", ")}`);
        }
      } catch {
        // metadata is decorative; ignore failures
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [shouldFetchTrack, trackId]);

  const handleSpotifyToggle = useCallback(async () => {
    if (!trackId) return;
    if (player.isPlaying) {
      await player.pause();
      return;
    }
    await player.playTrack(`spotify:track:${trackId}`);
  }, [trackId, player]);

  const handleTransportToggle = useCallback(() => pb.toggle(), [pb]);

  const handleStop = useCallback(() => pb.stop(), [pb]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ScoreViewerHeader
        title={score.title}
        onBack={() => {
          handleStop();
          onBack();
        }}
        onEdit={() => {
          handleStop();
          onEdit();
        }}
        onDelete={onDelete}
      />
      <SpotifyBar
        isAuthed={auth.isAuthed}
        isReady={player.isReady}
        isPlaying={player.isPlaying}
        errorMessage={player.errorMessage}
        hasTrack={!!trackId}
        trackLabel={trackLabel}
        onLogin={() => void auth.login()}
        onToggle={() => void handleSpotifyToggle()}
      />
      <div className="flex-1 overflow-auto px-4 py-3.5">
        <ScoreGrid measures={score.measures} currentStep={pb.currentStep} />
      </div>
      <Transport
        isPlaying={pb.isPlaying}
        currentStep={pb.currentStep}
        bpm={pb.bpm}
        loop={pb.loop}
        measures={score.measures}
        onToggle={handleTransportToggle}
        onStop={handleStop}
        onBpmChange={pb.setBpm}
        onSeek={pb.seekTo}
        onLoopToggle={() => pb.setLoop((l) => !l)}
      />
    </div>
  );
};

export default ScoreViewer;
