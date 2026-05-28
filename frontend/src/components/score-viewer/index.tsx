"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ScoreGrid from "@/components/score-grid";
import ScoreViewerHeader from "@/components/score-viewer/header";
import SpotifyBar from "@/components/score-viewer/spotify-bar";
import Transport from "@/components/transport";
import { usePlayback } from "@/hooks/usePlayback";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { getAudioFeatures, getTrack } from "@/lib/spotify/api";
import type { ScoreDetail } from "@/types/common";

type Props = {
  score: ScoreDetail;
  onEdit: () => void;
  onBack: () => void;
  onDelete?: () => void;
};

const ScoreViewer = ({ score, onEdit, onBack, onDelete }: Props) => {
  const pb = usePlayback(score);
  const trackId = score.spotifyTrackId;
  const auth = useSpotifyAuth();
  const player = useSpotifyPlayer();

  const [trackLabel, setTrackLabel] = useState<string | null>(null);
  // Spotify's audio-features endpoint may be unavailable; null means "fall back
  // to score.bpm" for the drum cursor speed when Spotify drives playback.
  const [audioFeaturesBpm, setAudioFeaturesBpm] = useState<number | null>(null);

  const shouldFetchTrack = !!trackId && auth.isAuthed;

  // Pull track metadata + tempo once the user is signed in and the score has a
  // linked track. The guarded effect avoids the "setState in effect" lint by
  // exiting early when there is nothing to fetch.
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
      try {
        const features = await getAudioFeatures(trackId);
        if (!isCancelled) setAudioFeaturesBpm(features?.tempo ?? null);
      } catch {
        if (!isCancelled) setAudioFeaturesBpm(null);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [shouldFetchTrack, trackId]);

  // Mirror the Spotify player's paused state onto the drum playback so the
  // cursor follows external play/pause (e.g. user pausing from Spotify app).
  const pbRef = useRef(pb);
  useEffect(() => {
    pbRef.current = pb;
  }, [pb]);
  useEffect(() => {
    return player.onStateChange((state) => {
      if (!state) return;
      if (state.paused) pbRef.current.pause();
      else pbRef.current.play();
    });
  }, [player]);

  const handleSpotifyToggle = useCallback(async () => {
    if (!trackId) return;
    if (player.isPlaying) {
      await player.pause();
      return;
    }
    // Override the drum cursor BPM with Spotify's reported tempo (when known)
    // before starting so the silent drum playback advances at the song's speed.
    if (audioFeaturesBpm) pb.setBpm(Math.round(audioFeaturesBpm));
    pb.setSilent(true);
    pb.stop();
    pb.seekTo(0);
    pb.play();
    try {
      await player.playTrack(`spotify:track:${trackId}`);
    } catch (e) {
      pb.pause();
      throw e;
    }
  }, [trackId, audioFeaturesBpm, pb, player]);

  // The Transport's own Play button is the standalone drum mode — make sure it
  // is audible again when used directly.
  const handleTransportToggle = useCallback(() => {
    if (pb.isSilent) pb.setSilent(false);
    pb.toggle();
  }, [pb]);

  const handleStop = useCallback(() => {
    pb.stop();
    if (player.isPlaying) void player.pause();
  }, [pb, player]);

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
