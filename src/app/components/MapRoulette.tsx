"use client";

import { useMemo, useState } from "react";

type MapItem = {
  id: number;
  name: string;
  votes: number;
  selected: boolean;
};

const INITIAL_MAPS: MapItem[] = [
  "Busan",
  "Ilios",
  "Lijiang Tower",
  "Nepal",
  "Oasis",
  "Antarctic Peninsula",
  "Circuit Royal",
  "Dorado",
  "Havana",
  "Junkertown",
  "Rialto",
  "Route 66",
  "Shambali Monastery",
  "Watchpoint: Gibraltar",
  "Blizzard World",
  "Eichenwalde",
  "Hollywood",
  "King's Row",
  "Midtown",
  "Numbani",
  "Paraiso",
  "Colosseo",
  "Esperanca",
  "New Queen Street",
  "New Junk City",
  "Suravasa",
].map((name, index) => ({
  id: index,
  name,
  votes: 1,
  selected: false,
}));

export default function MapRoulette() {
  const [maps, setMaps] = useState<MapItem[]>(INITIAL_MAPS);
  const [excludeSelected, setExcludeSelected] = useState(true);
  const [result, setResult] = useState<string>("未抽選");
  const [message, setMessage] = useState("");

  const candidates = useMemo(() => {
    return maps.filter((map) => {
      if (map.votes < 1) return false;
      if (excludeSelected && map.selected) return false;
      return true;
    });
  }, [maps, excludeSelected]);

  function setAllVotes(votes: number) {
    setMaps((prev) =>
      prev.map((map) => ({
        ...map,
        votes,
      }))
    );
  }

  function resetSelected() {
    setMaps((prev) =>
      prev.map((map) => ({
        ...map,
        selected: false,
      }))
    );
    setMessage("");
  }

  function updateVotes(id: number, votes: number) {
    setMaps((prev) =>
      prev.map((map) =>
        map.id === id
          ? {
              ...map,
              votes: Math.max(0, votes),
            }
          : map
      )
    );
  }

  function toggleSelected(id: number) {
    setMaps((prev) =>
      prev.map((map) =>
        map.id === id
          ? {
              ...map,
              selected: !map.selected,
            }
          : map
      )
    );
  }

  function startRoulette() {
    setMessage("");

    if (candidates.length === 0) {
      setMessage("当選済みのマップしか残っていません。当選リセットしてください。");
      return;
    }

    const totalVotes = candidates.reduce((sum, map) => sum + map.votes, 0);
    let random = Math.floor(Math.random() * totalVotes);

    let winner = candidates[0];

    for (const map of candidates) {
      random -= map.votes;

      if (random < 0) {
        winner = map;
        break;
      }
    }

    setResult(winner.name);

    setMaps((prev) =>
      prev.map((map) =>
        map.id === winner.id
          ? {
              ...map,
              selected: true,
            }
          : map
      )
    );
  }

  return (
    <section className="card">
      <section className="hero">
        <h1>Overwatch Map Roulette</h1>
        <p>マップをランダムで抽選。当選率に重みをつけられます。</p>
      </section>

      <section className="rouletteResult">
        <div className="rouletteMapName">{result}</div>

        <button className="primary" onClick={startRoulette}>
          スタート
        </button>

        {message && <p className="error">{message}</p>}
      </section>

      <section>
        <h2>マップ投票</h2>

        <div className="actionRow">
          <button onClick={() => setAllVotes(0)}>0票にする</button>
          <button onClick={() => setAllVotes(1)}>1票にする</button>
          <button onClick={resetSelected}>当選リセット</button>

          <label className="checkLabel">
            <input
              type="checkbox"
              checked={excludeSelected}
              onChange={(e) => setExcludeSelected(e.target.checked)}
            />
            当選済みを選ばない
          </label>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>当選済み</th>
                <th>マップ名</th>
                <th>得票数</th>
              </tr>
            </thead>

            <tbody>
              {maps.map((map) => (
                <tr key={map.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={map.selected}
                      onChange={() => toggleSelected(map.id)}
                    />
                  </td>

                  <td>{map.name}</td>

                  <td>
                    <div className="voteControl">
                      <button onClick={() => updateVotes(map.id, map.votes - 1)}>
                        -
                      </button>

                      <input
                        type="number"
                        min={0}
                        value={map.votes}
                        onChange={(e) =>
                          updateVotes(map.id, Number(e.target.value))
                        }
                      />

                      <button onClick={() => updateVotes(map.id, map.votes + 1)}>
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}