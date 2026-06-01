"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeSpotifyLogin, consumeReturnTo } from "@/lib/spotify/auth";

const SpotifyCallbackInner = () => {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");
  const state = params.get("state");
  const oauthError = params.get("error");
  // Failures from the async token exchange feed in here; the OAuth-level error
  // is derived directly from the query string above.
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  useEffect(() => {
    if (oauthError || !code) return;
    void (async () => {
      try {
        await completeSpotifyLogin(code, state);
        const returnTo = consumeReturnTo() ?? "/";
        router.replace(returnTo);
      } catch (e) {
        setExchangeError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [code, state, oauthError, router]);

  const errorMessage = oauthError ?? (code ? exchangeError : "missing code");

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {errorMessage
        ? `Spotify login failed: ${errorMessage}`
        : "Connecting to Spotify…"}
    </div>
  );
};

const SpotifyCallbackPage = () => (
  <Suspense fallback={null}>
    <SpotifyCallbackInner />
  </Suspense>
);

export default SpotifyCallbackPage;
