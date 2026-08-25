"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MapMode =
    | "Control"
    | "Escort"
    | "Hybrid"
    | "Push"
    | "Flashpoint";

type MapItem = {
    id: number;
    name: string;
    mode: MapMode;
    votes: number;
    selected: boolean;
};

const BASE_MAPS: { name: string; mode: MapMode }[] = [
    { name: "Busan", mode: "Control" },
    { name: "Ilios", mode: "Control" },
    { name: "Lijiang Tower", mode: "Control" },
    { name: "Nepal", mode: "Control" },
    { name: "Oasis", mode: "Control" },
    { name: "Antarctic Peninsula", mode: "Control" },

    { name: "Circuit Royal", mode: "Escort" },
    { name: "Dorado", mode: "Escort" },
    { name: "Havana", mode: "Escort" },
    { name: "Junkertown", mode: "Escort" },
    { name: "Rialto", mode: "Escort" },
    { name: "Route 66", mode: "Escort" },
    { name: "Shambali Monastery", mode: "Escort" },
    { name: "Watchpoint: Gibraltar", mode: "Escort" },

    { name: "Blizzard World", mode: "Hybrid" },
    { name: "Eichenwalde", mode: "Hybrid" },
    { name: "Hollywood", mode: "Hybrid" },
    { name: "King's Row", mode: "Hybrid" },
    { name: "Midtown", mode: "Hybrid" },
    { name: "Numbani", mode: "Hybrid" },
    { name: "Paraiso", mode: "Hybrid" },
    { name: "Neon Junction", mode: "Hybrid" },

    { name: "Colosseo", mode: "Push" },
    { name: "Esperanca", mode: "Push" },
    { name: "New Queen Street", mode: "Push" },

    { name: "New Junk City", mode: "Flashpoint" },
    { name: "Suravasa", mode: "Flashpoint" },
    { name: "AATLIS", mode: "Flashpoint" },
];

const INITIAL_MAPS: MapItem[] = BASE_MAPS.map((map, index) => ({
    id: index,
    name: map.name,
    mode: map.mode,
    votes: 1,
    selected: false,
}));

export default function MapRoulette() {
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    const [maps, setMaps] = useState<MapItem[]>(INITIAL_MAPS);
    const [excludeSelected, setExcludeSelected] = useState(true);
    const [enabledModes, setEnabledModes] = useState<Record<MapMode, boolean>>({
        Control: true,
        Escort: true,
        Hybrid: true,
        Push: true,
        Flashpoint: true,
    });
    const [result, setResult] = useState<string>("未抽選");
    const [message, setMessage] = useState("");
    const [isRolling, setIsRolling] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const candidates = useMemo(() => {
        return maps.filter((map) => {
            if (map.votes < 1) return false;
            if (!enabledModes[map.mode]) return false;
            if (excludeSelected && map.selected) return false;
            return true;
        });
    }, [maps, excludeSelected, enabledModes]);

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

    function pickWeightedMap(targets: MapItem[]) {
        const totalVotes = targets.reduce((sum, map) => sum + map.votes, 0);
        let random = Math.floor(Math.random() * totalVotes);

        for (const map of targets) {
            random -= map.votes;

            if (random < 0) {
                return map;
            }
        }

        return targets[0];
    }

    function startRoulette() {
        setMessage("");

        if (isRolling) return;

        if (candidates.length === 0) {
            setMessage(
                "当選済みのマップしか残っていません。当選リセットしてください。"
            );
            return;
        }

        setIsRolling(true);

        const winner = pickWeightedMap(candidates);

        let count = 0;
        const totalCount = 18;

        function roll() {
            count++;

            if (count >= totalCount) {
                setMessage(`${winner.name} に決定！！`);

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

                setIsRolling(false);
                return;
            }

            if (count === totalCount - 1) {
                setResult(winner.name);
            } else {
                const randomMap =
                    candidates[Math.floor(Math.random() * candidates.length)];

                setResult(randomMap.name);
            }

            let delay: number;

            if (count <= 5) {
                delay = 90;
            } else if (count <= 9) {
                delay = 160;
            } else {
                const slowStep = count - 9;
                delay = 220 + slowStep * 55;
            }

            setTimeout(roll, delay);
        }

        roll();
    }
    function toggleMode(mode: MapMode) {
        setEnabledModes((prev) => ({
            ...prev,
            [mode]: !prev[mode],
        }));
    }

    return (
        <section className="card">
            <section className="hero">
                <h1>Overwatch Map Roulette</h1>
                <p>マップをランダムで抽選。当選率に重みをつけられます。</p>
            </section>

            <section className="rouletteResult">
                <div
                    className={`rouletteMapName ${isRolling ? "rolling" : result !== "未抽選" ? "winner" : ""
                        }`}
                >
                    {result}
                </div>

                <button className="primary" onClick={startRoulette} disabled={isRolling}>
                    {isRolling ? "抽選中..." : "スタート"}
                </button>

                {message && <p className="error">{message}</p>}
            </section>

            <section>
                <h2>マップ投票</h2>

                <div className="modeFilter">
                    {(["Control", "Escort", "Hybrid", "Push", "Flashpoint"] as MapMode[]).map(
                        (mode) => (
                            <label key={mode} className="checkLabel">
                                <input
                                    type="checkbox"
                                    checked={enabledModes[mode]}
                                    onChange={() => toggleMode(mode)}
                                />
                                {mode}
                            </label>
                        )
                    )}
                </div>

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
                                <th>ルール</th>
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

                                    <td>{map.mode}</td>

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