"use client";

import { useState } from "react";
import TeamMaker from "./components/TeamMaker";

export default function Home() {
  const [tab, setTab] = useState<"team" | "map">("team");

  return (
    <main className="page">
      <h1>ひやじょうの部屋</h1>

      <div className="tabs">
        <button onClick={() => setTab("team")}>
          チーム分け
        </button>

        <button onClick={() => setTab("map")}>
          マップ
        </button>
      </div>

      {tab === "team" && <TeamMaker />}

      {tab === "map" && (
        <div>
          <h2>Overwatch Map Roulette</h2>
          <p>今後実装予定</p>
        </div>
      )}
    </main>
  );
}