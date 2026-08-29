"use client";

import { useState } from "react";
import TeamMaker from "./components/TeamMaker";
import MapRoulette from "./components/MapRoulette";

export default function Home() {
  const [tab, setTab] = useState<"team" | "map">("team");

  return (
    <main className="page">

      <div className="pageHeader">
        <h1>Overwatchカスタム主催者向けツール</h1>

        <div className="creator">
          <span>作成者：</span>

          <a
            href="https://x.com/Hiyazyo"
            target="_blank"
            rel="noopener noreferrer"
            className="creatorLink"
          >
            @Hiyazyo
          </a>
        </div>
      </div>

      <div className="tabs">
        <button onClick={() => setTab("team")}>
          チーム分け
        </button>

        <button onClick={() => setTab("map")}>
          マップ
        </button>
      </div>

      {tab === "team" && <TeamMaker />}

      {tab === "map" && <MapRoulette />}
    </main>
  );
}