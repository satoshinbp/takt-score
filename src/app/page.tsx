"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { makeSamples } from "@/lib/constants";
import { loadScores } from "@/lib/storage";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";

export default function Page() {
  const [scores] = useState(() => loadScores() ?? makeSamples());
  const router = useRouter();

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100vh", background: "var(--bg)", color: "var(--t)" }}
    >
      <Header />
      <Dashboard
        scores={scores}
        onSelect={(s) => router.push(`/scores/${s.id}`)}
        onCreate={() => router.push("/scores/new")}
      />
    </div>
  );
}
