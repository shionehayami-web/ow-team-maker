"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "tank" | "damage" | "support" | "spectator";
type Tab = "roleFixed" | "free" | "guide";

type Member = {
  name: string;
  tankRank: string;
  damageRank: string;
  supportRank: string;
};

type Player = Member & {
  id: number;
  tankPoint: number;
  damagePoint: number;
  supportPoint: number;
};

type Remaining = {
  tank: number;
  damage: number;
  support: number;
  spectator: number;
};

type Pair = {
  role: Exclude<Role, "spectator">;
  label: string;
  blue: Player;
  red: Player;
  diff: number;
};

type MatchResult = {
  matchNo: number;

  blue: {
    tank: Player;
    damage1: Player;
    damage2: Player;
    support1: Player;
    support2: Player;
  };

  red: {
    tank: Player;
    damage1: Player;
    damage2: Player;
    support1: Player;
    support2: Player;
  };

  spectators: Player[];

  pairDiff: number;
  teamDiff: number;
  score: number;
};

type RoleCount = {
  name: string;
  tank: number;
  damage: number;
  support: number;
  spectator: number;
};

type SlotKey =
  | "blue.tank"
  | "blue.damage1"
  | "blue.damage2"
  | "blue.support1"
  | "blue.support2"
  | "red.tank"
  | "red.damage1"
  | "red.damage2"
  | "red.support1"
  | "red.support2"
  | "spectator.0"
  | "spectator.1";

type SelectedSlot = {
  matchNo: number;
  slotKey: SlotKey;
};

const INITIAL_RANK = "Diamond1";

const STORAGE_KEY = "overwatch-team-maker-members";

const TANK_WEIGHT = 1.2;

const TRY_COUNT = 3000;

const TEST_NAMES = [
  "Strawberry",
  "Pineapple",
  "Apple",
  "Orange",
  "Melon",
  "Banana",
  "Peach",
  "Cherry",
  "Grape",
  "Kiwi",
  "Lemon",
  "Mango",
  "Coconut",
  "Blueberry",
  "Avocado",
  "Watermelon",
];

/* =========================
   ランク
========================= */

const ranks = [
  "Champion",

  ...[1, 2, 3, 4, 5].map(
    (i) => `Grandmaster${i}`
  ),

  ...[1, 2, 3, 4, 5].map(
    (i) => `Master${i}`
  ),

  ...[1, 2, 3, 4, 5].map(
    (i) => `Diamond${i}`
  ),

  ...[1, 2, 3, 4, 5].map(
    (i) => `Emerald${i}`
  ),

  ...[1, 2, 3, 4, 5].map(
    (i) => `Platinum${i}`
  ),

  ...[1, 2, 3, 4, 5].map(
    (i) => `Gold${i}`
  ),

  ...[1, 2, 3, 4, 5].map(
    (i) => `Silver${i}`
  ),

  ...[1, 2, 3, 4, 5].map(
    (i) => `Bronze${i}`
  ),
];

/* =========================
   ランク → ポイント
========================= */

function rankToPoint(rank: string): number {
  if (rank === "Champion") {
    return 50;
  }

  const basePoints: Record<string, number> = {
    Grandmaster: 45,
    Master: 40,
    Diamond: 35,
    Emerald: 30,
    Platinum: 25,
    Gold: 20,
    Silver: 15,
    Bronze: 10,
  };

  for (const tier of Object.keys(basePoints)) {
    if (rank.startsWith(tier)) {
      const division = Number(
        rank.replace(tier, "")
      );

      return (
        basePoints[tier] -
        (division - 1)
      );
    }
  }

  return 0;
}

/* =========================
   初期メンバー
========================= */

function createInitialMembers(): Member[] {
  return Array.from(
    { length: 16 },
    () => ({
      name: "",
      tankRank: INITIAL_RANK,
      damageRank: INITIAL_RANK,
      supportRank: INITIAL_RANK,
    })
  );
}

/* =========================
   組み合わせ
========================= */

function combinations<T>(
  items: T[],
  count: number
): T[][] {
  if (count === 0) return [[]];

  if (items.length < count) {
    return [];
  }

  const result: T[][] = [];

  function dfs(
    start: number,
    selected: T[]
  ) {
    if (selected.length === count) {
      result.push([...selected]);
      return;
    }

    for (
      let i = start;
      i < items.length;
      i++
    ) {
      selected.push(items[i]);

      dfs(
        i + 1,
        selected
      );

      selected.pop();
    }
  }

  dfs(0, []);

  return result;
}

/* =========================
   シャッフル
========================= */

function shuffle<T>(
  items: T[]
): T[] {
  const copied = [...items];

  for (
    let i = copied.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      copied[i],
      copied[j],
    ] = [
      copied[j],
      copied[i],
    ];
  }

  return copied;
}

/* =========================
   ロールポイント取得
========================= */

function getRolePoint(
  player: Player,
  role: Exclude<
    Role,
    "spectator"
  >
) {
  if (role === "tank") {
    return player.tankPoint;
  }

  if (role === "damage") {
    return player.damagePoint;
  }

  return player.supportPoint;
}

/* =========================
   同ロールペア作成
========================= */

function makeBestPairs(
  players: Player[],
  role: Exclude<
    Role,
    "spectator"
  >,
  pairCount: number
): {
  pairs: [Player, Player][];
  diff: number;
} {
  let bestPairs:
    [Player, Player][] = [];

  let bestDiff = Infinity;

  function dfs(
    remain: Player[],
    pairs: [Player, Player][],
    currentDiff: number
  ) {
    if (
      pairs.length === pairCount
    ) {
      if (
        currentDiff < bestDiff
      ) {
        bestDiff = currentDiff;

        bestPairs = [
          ...pairs,
        ];
      }

      return;
    }

    if (
      remain.length < 2
    ) {
      return;
    }

    const [
      first,
      ...rest
    ] = remain;

    for (
      const second of rest
    ) {
      const nextRemain =
        rest.filter(
          (p) =>
            p.id !== second.id
        );

      const rawDiff =
        Math.abs(
          getRolePoint(
            first,
            role
          ) -
            getRolePoint(
              second,
              role
            )
        );

      const weightedDiff =
        role === "tank"
          ? rawDiff *
            TANK_WEIGHT
          : rawDiff;

      dfs(
        nextRemain,
        [
          ...pairs,
          [
            first,
            second,
          ],
        ],
        currentDiff +
          weightedDiff
      );
    }
  }

  dfs(
    players,
    [],
    0
  );

  return {
    pairs: bestPairs,
    diff: bestDiff,
  };
}

/* =========================
   青赤決定
========================= */

function decideBlueRed(
  tankPair:
    [Player, Player],

  damagePairs:
    [Player, Player][],

  supportPairs:
    [Player, Player][]
) {
  const pairs = [
    {
      role:
        "tank" as const,
      label: "tank",
      pair: tankPair,
    },

    {
      role:
        "damage" as const,
      label: "damage1",
      pair:
        damagePairs[0],
    },

    {
      role:
        "damage" as const,
      label: "damage2",
      pair:
        damagePairs[1],
    },

    {
      role:
        "support" as const,
      label: "support1",
      pair:
        supportPairs[0],
    },

    {
      role:
        "support" as const,
      label: "support2",
      pair:
        supportPairs[1],
    },
  ];

  let best: Pair[] = [];

  let bestDiff =
    Infinity;

  for (
    let mask = 0;
    mask < 32;
    mask++
  ) {
    const result: Pair[] =
      [];

    let blueTotal = 0;
    let redTotal = 0;

    pairs.forEach(
      (
        item,
        index
      ) => {
        const isSwap =
          Boolean(
            mask &
              (1 <<
                index)
          );

        const blue =
          isSwap
            ? item.pair[1]
            : item.pair[0];

        const red =
          isSwap
            ? item.pair[0]
            : item.pair[1];

        const weight =
          item.role ===
          "tank"
            ? TANK_WEIGHT
            : 1;

        blueTotal +=
          getRolePoint(
            blue,
            item.role
          ) * weight;

        redTotal +=
          getRolePoint(
            red,
            item.role
          ) * weight;

        result.push({
          role: item.role,
          label:
            item.label,
          blue,
          red,

          diff:
            Math.abs(
              getRolePoint(
                blue,
                item.role
              ) -
                getRolePoint(
                  red,
                  item.role
                )
            ) *
            weight,
        });
      }
    );

    const teamDiff =
      Math.abs(
        blueTotal -
          redTotal
      );

    if (
      teamDiff <
      bestDiff
    ) {
      bestDiff =
        teamDiff;

      best =
        result;
    }
  }

  return {
    pairs: best,
    teamDiff:
      bestDiff,
  };
}

/* =========================
   Remaining複製
========================= */

function cloneRemaining(
  map: Map<
    number,
    Remaining
  >
) {
  return new Map(
    [...map.entries()].map(
      ([
        id,
        value,
      ]) => [
        id,
        {
          ...value,
        },
      ]
    )
  );
}

/* =========================
   ランダム組み合わせ取得
========================= */

function pickRandomCombo<T>(
  combos: T[][]
): T[] | null {
  if (
    combos.length === 0
  ) {
    return null;
  }

  return combos[
    Math.floor(
      Math.random() *
        combos.length
    )
  ];
}

/* =========================
   1候補作成
========================= */

function createOneCandidate(
  players: Player[]
):
  | MatchResult[]
  | null {
  let remaining =
    new Map<
      number,
      Remaining
    >();

  players.forEach(
    (p) => {
      remaining.set(
        p.id,
        {
          tank: 1,
          damage: 2,
          support: 2,
          spectator: 1,
        }
      );
    }
  );

  const results:
    MatchResult[] = [];

  for (
    let matchIndex = 0;
    matchIndex < 6;
    matchIndex++
  ) {
    const matchNo =
      matchIndex + 1;

    const remainingMatches =
      6 - matchIndex;

    const current =
      cloneRemaining(
        remaining
      );

    /* 観戦 */

    const forcedSpectators =
      players.filter(
        (p) =>
          current.get(
            p.id
          )!.spectator ===
          remainingMatches
      );

    if (
      forcedSpectators.length >
      2
    ) {
      return null;
    }

    const spectatorCandidates =
      players.filter(
        (p) =>
          current.get(
            p.id
          )!.spectator >
            0 &&
          !forcedSpectators.some(
            (f) =>
              f.id ===
              p.id
          )
      );

    const spectatorCombo =
      pickRandomCombo(
        combinations(
          shuffle(
            spectatorCandidates
          ),
          2 -
            forcedSpectators.length
        )
      );

    if (
      !spectatorCombo
    ) {
      return null;
    }

    const spectators = [
      ...forcedSpectators,
      ...spectatorCombo,
    ];

    spectators.forEach(
      (p) => {
        current.get(
          p.id
        )!.spectator -= 1;
      }
    );

    const activeAfterSpectator =
      players.filter(
        (p) =>
          !spectators.some(
            (s) =>
              s.id ===
              p.id
          )
      );

    /* Tank */

    const forcedTanks =
      activeAfterSpectator.filter(
        (p) =>
          current.get(
            p.id
          )!.tank ===
          remainingMatches
      );

    if (
      forcedTanks.length >
      2
    ) {
      return null;
    }

    const tankCandidates =
      activeAfterSpectator.filter(
        (p) =>
          current.get(
            p.id
          )!.tank >
            0 &&
          !forcedTanks.some(
            (f) =>
              f.id ===
              p.id
          )
      );

    const tankCombo =
      pickRandomCombo(
        combinations(
          shuffle(
            tankCandidates
          ),
          2 -
            forcedTanks.length
        )
      );

    if (
      !tankCombo
    ) {
      return null;
    }

    const tanks = [
      ...forcedTanks,
      ...tankCombo,
    ];

    tanks.forEach(
      (p) => {
        current.get(
          p.id
        )!.tank -= 1;
      }
    );

    const afterTank =
      activeAfterSpectator.filter(
        (p) =>
          !tanks.some(
            (t) =>
              t.id ===
              p.id
          )
      );

    /* Damage */

    const forcedDamages =
      afterTank.filter(
        (p) =>
          current.get(
            p.id
          )!.damage ===
          remainingMatches
      );

    if (
      forcedDamages.length >
      4
    ) {
      return null;
    }

    const damageCandidates =
      afterTank.filter(
        (p) =>
          current.get(
            p.id
          )!.damage >
            0 &&
          !forcedDamages.some(
            (f) =>
              f.id ===
              p.id
          )
      );

    const damageCombo =
      pickRandomCombo(
        combinations(
          shuffle(
            damageCandidates
          ),
          4 -
            forcedDamages.length
        )
      );

    if (
      !damageCombo
    ) {
      return null;
    }

    const damages = [
      ...forcedDamages,
      ...damageCombo,
    ];

    damages.forEach(
      (p) => {
        current.get(
          p.id
        )!.damage -= 1;
      }
    );

    /* Support */

    const supports =
      afterTank.filter(
        (p) =>
          !damages.some(
            (d) =>
              d.id ===
              p.id
          )
      );

    if (
      supports.length !==
      4
    ) {
      return null;
    }

    if (
      supports.some(
        (p) =>
          current.get(
            p.id
          )!.support <=
          0
      )
    ) {
      return null;
    }

    supports.forEach(
      (p) => {
        current.get(
          p.id
        )!.support -=
          1;
      }
    );

    /* ペア作成 */

    const tankPairData =
      makeBestPairs(
        tanks,
        "tank",
        1
      );

    const damagePairData =
      makeBestPairs(
        damages,
        "damage",
        2
      );

    const supportPairData =
      makeBestPairs(
        supports,
        "support",
        2
      );

    if (
      tankPairData
        .pairs.length !==
        1 ||
      damagePairData
        .pairs.length !==
        2 ||
      supportPairData
        .pairs.length !==
        2
    ) {
      return null;
    }

    /* 青赤 */

    const blueRed =
      decideBlueRed(
        tankPairData
          .pairs[0],
        damagePairData
          .pairs,
        supportPairData
          .pairs
      );

    const tank =
      blueRed.pairs.find(
        (p) =>
          p.label ===
          "tank"
      )!;

    const damage1 =
      blueRed.pairs.find(
        (p) =>
          p.label ===
          "damage1"
      )!;

    const damage2 =
      blueRed.pairs.find(
        (p) =>
          p.label ===
          "damage2"
      )!;

    const support1 =
      blueRed.pairs.find(
        (p) =>
          p.label ===
          "support1"
      )!;

    const support2 =
      blueRed.pairs.find(
        (p) =>
          p.label ===
          "support2"
      )!;

    const pairDiff =
      tankPairData.diff +
      damagePairData.diff +
      supportPairData.diff;

    const score =
      pairDiff +
      blueRed.teamDiff;

    results.push({
      matchNo,

      blue: {
        tank:
          tank.blue,
        damage1:
          damage1.blue,
        damage2:
          damage2.blue,
        support1:
          support1.blue,
        support2:
          support2.blue,
      },

      red: {
        tank:
          tank.red,
        damage1:
          damage1.red,
        damage2:
          damage2.red,
        support1:
          support1.red,
        support2:
          support2.red,
      },

      spectators,

      pairDiff,

      teamDiff:
        blueRed.teamDiff,

      score,
    });

    remaining =
      current;
  }

  const isSuccess =
    [
      ...remaining.values(),
    ].every(
      (r) =>
        r.tank === 0 &&
        r.damage === 0 &&
        r.support ===
          0 &&
        r.spectator ===
          0
    );

  return isSuccess
    ? results
    : null;
}

/* =========================
   全試合評価
========================= */

function evaluateAllMatches(
  matches: MatchResult[]
) {
  const totalScore =
    matches.reduce(
      (sum, m) =>
        sum + m.score,
      0
    );

  const worstTeamDiff =
    Math.max(
      ...matches.map(
        (m) =>
          m.teamDiff
      )
    );

  const worstPairDiff =
    Math.max(
      ...matches.map(
        (m) =>
          m.pairDiff
      )
    );

  return (
    totalScore +
    worstTeamDiff *
      2 +
    worstPairDiff *
      2
  );
}

/* =========================
   チーム作成
========================= */

function makeTeams(
  players: Player[]
) {
  let best:
    MatchResult[] | null =
    null;

  let bestScore =
    Infinity;

  for (
    let i = 0;
    i < TRY_COUNT;
    i++
  ) {
    const candidate =
      createOneCandidate(
        players
      );

    if (
      !candidate
    ) {
      continue;
    }

    const score =
      evaluateAllMatches(
        candidate
      );

    if (
      score <
      bestScore
    ) {
      bestScore =
        score;

      best =
        candidate;
    }
  }

  return best;
}

/* =========================
   RankSelect
========================= */

function RankSelect({
  value,
  onChange,
}: {
  value: string;

  onChange:
    (
      value: string
    ) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value
        )
      }
    >
      {ranks.map(
        (rank) => (
          <option
            key={rank}
            value={rank}
          >
            {rank}
          </option>
        )
      )}
    </select>
  );
}

/* =========================
   結果行
========================= */

function ResultRow({
  role,
  blue,
  red,
  rankKey,
  showDetails,
  vs = false,
  blueSlotKey,
  redSlotKey,
  matchNo,
  swapMode,
  selectedSlot,
  onSlotClick,
}: {
  role: string;

  blue: Player;

  red: Player;

  rankKey:
    | "tankRank"
    | "damageRank"
    | "supportRank";

  showDetails: boolean;

  vs?: boolean;

  blueSlotKey:
    SlotKey;

  redSlotKey:
    SlotKey;

  matchNo: number;

  swapMode: boolean;

  selectedSlot:
    SelectedSlot | null;

  onSlotClick:
    (
      matchNo: number,
      slotKey: SlotKey
    ) => void;
}) {
  const isBlueSelected =
    selectedSlot?.matchNo ===
      matchNo &&
    selectedSlot.slotKey ===
      blueSlotKey;

  const isRedSelected =
    selectedSlot?.matchNo ===
      matchNo &&
    selectedSlot.slotKey ===
      redSlotKey;

  return (
    <tr>
      <td className="blueCell">
        {role}
      </td>

      <td
        className={`
          blueCell
          ${
            swapMode
              ? "swapCell"
              : ""
          }
          ${
            isBlueSelected
              ? "selectedCell"
              : ""
          }
        `}
        onClick={() =>
          onSlotClick(
            matchNo,
            blueSlotKey
          )
        }
      >
        {blue.name}
      </td>

      {showDetails && (
        <td className="blueCell">
          {
            blue[
              rankKey
            ]
          }
        </td>
      )}

      <td>
        {vs
          ? "vs"
          : ""}
      </td>

      <td className="redCell">
        {role}
      </td>

      <td
        className={`
          redCell
          ${
            swapMode
              ? "swapCell"
              : ""
          }
          ${
            isRedSelected
              ? "selectedCell"
              : ""
          }
        `}
        onClick={() =>
          onSlotClick(
            matchNo,
            redSlotKey
          )
        }
      >
        {red.name}
      </td>

      {showDetails && (
        <td className="redCell">
          {
            red[
              rankKey
            ]
          }
        </td>
      )}
    </tr>
  );
}

/* =========================
   TeamMaker
========================= */

export default function TeamMaker() {
  const [
    members,
    setMembers,
  ] =
    useState<Member[]>(
      createInitialMembers
    );

  const [
    bulkRank,
    setBulkRank,
  ] =
    useState(
      INITIAL_RANK
    );

  const [
    tab,
    setTab,
  ] =
    useState<Tab>(
      "roleFixed"
    );

  const [
    results,
    setResults,
  ] =
    useState<
      MatchResult[]
    >([]);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    showDetails,
    setShowDetails,
  ] =
    useState(false);

  const [
    swapMode,
    setSwapMode,
  ] =
    useState(false);

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState<
      SelectedSlot | null
    >(null);

  /* 保存読み込み */

  useEffect(() => {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return;
    }

    try {
      const parsed =
        JSON.parse(
          saved
        ) as Member[];

      if (
        Array.isArray(
          parsed
        ) &&
        parsed.length ===
          16
      ) {
        setMembers(
          parsed
        );
      }
    } catch {
      localStorage.removeItem(
        STORAGE_KEY
      );
    }
  }, []);

  /* 自動保存 */

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        members
      )
    );
  }, [members]);

  /* Player変換 */

  const players =
    useMemo<
      Player[]
    >(() => {
      return members
        .map(
          (
            m,
            index
          ) => ({
            ...m,

            id:
              index,

            tankPoint:
              rankToPoint(
                m.tankRank
              ),

            damagePoint:
              rankToPoint(
                m.damageRank
              ),

            supportPoint:
              rankToPoint(
                m.supportRank
              ),
          })
        )
        .filter(
          (m) =>
            m.name.trim() !==
            ""
        );
    }, [members]);

  const roleFixedPlayers =
    useMemo(() => {
      return players.slice(
        0,
        12
      );
    }, [players]);

  const isOver12 =
    players.length > 12;

  /* 担当回数 */

  const roleCounts =
    useMemo<
      RoleCount[]
    >(() => {
      return roleFixedPlayers.map(
        (
          player
        ) => {
          const count:
            RoleCount =
            {
              name:
                player.name,

              tank: 0,

              damage: 0,

              support: 0,

              spectator: 0,
            };

          results.forEach(
            (
              match
            ) => {
              if (
                match.blue
                  .tank.id ===
                  player.id ||
                match.red
                  .tank.id ===
                  player.id
              ) {
                count.tank++;
              }

              if (
                match.blue
                  .damage1
                  .id ===
                  player.id ||
                match.blue
                  .damage2
                  .id ===
                  player.id ||
                match.red
                  .damage1
                  .id ===
                  player.id ||
                match.red
                  .damage2
                  .id ===
                  player.id
              ) {
                count.damage++;
              }

              if (
                match.blue
                  .support1
                  .id ===
                  player.id ||
                match.blue
                  .support2
                  .id ===
                  player.id ||
                match.red
                  .support1
                  .id ===
                  player.id ||
                match.red
                  .support2
                  .id ===
                  player.id
              ) {
                count.support++;
              }

              if (
                match.spectators.some(
                  (p) =>
                    p.id ===
                    player.id
                )
              ) {
                count.spectator++;
              }
            }
          );

          return count;
        }
      );
    }, [
      results,
      roleFixedPlayers,
    ]);

  function updateMember(
    index: number,
    value: Partial<Member>
  ) {
    setMembers(
      (prev) =>
        prev.map(
          (
            member,
            i
          ) =>
            i === index
              ? {
                  ...member,
                  ...value,
                }
              : member
        )
    );
  }

  function applyBulkRank() {
    setMembers(
      (prev) =>
        prev.map(
          (member) => ({
            ...member,

            tankRank:
              bulkRank,

            damageRank:
              bulkRank,

            supportRank:
              bulkRank,
          })
        )
    );
  }

  function copyTankRank(
    index: number
  ) {
    setMembers(
      (prev) =>
        prev.map(
          (
            member,
            i
          ) =>
            i === index
              ? {
                  ...member,

                  damageRank:
                    member.tankRank,

                  supportRank:
                    member.tankRank,
                }
              : member
        )
    );
  }

  function randomRank() {
    return ranks[
      Math.floor(
        Math.random() *
          ranks.length
      )
    ];
  }

  function fillTestMembers() {
    const shuffled = [
      ...TEST_NAMES,
    ].sort(
      () =>
        Math.random() -
        0.5
    );

    setMembers(
      (prev) =>
        prev.map(
          (
            member,
            index
          ) => ({
            ...member,

            name:
              shuffled[
                index
              ],

            tankRank:
              randomRank(),

            damageRank:
              randomRank(),

            supportRank:
              randomRank(),
          })
        )
    );
  }

  function clearSavedMembers() {
    localStorage.removeItem(
      STORAGE_KEY
    );

    setMembers(
      createInitialMembers()
    );

    setResults([]);
  }

  function runRoleFixed() {
    setError("");

    setResults([]);

    if (
      players.length < 12
    ) {
      setError(
        "ロール指定モードは、メンバー名が入力された人を12人以上にしてください。"
      );

      return;
    }

    const result =
      makeTeams(
        roleFixedPlayers
      );

    if (!result) {
      setError(
        "条件を満たすチーム分けを作成できませんでした。もう一度実行してください。"
      );

      return;
    }

    setResults(
      result
    );
  }

  /* =========================
     入れ替え
  ========================= */

  function getPlayerFromSlot(
    match: MatchResult,
    slotKey: SlotKey
  ): Player {
    if (
      slotKey ===
      "blue.tank"
    )
      return match.blue
        .tank;

    if (
      slotKey ===
      "blue.damage1"
    )
      return match.blue
        .damage1;

    if (
      slotKey ===
      "blue.damage2"
    )
      return match.blue
        .damage2;

    if (
      slotKey ===
      "blue.support1"
    )
      return match.blue
        .support1;

    if (
      slotKey ===
      "blue.support2"
    )
      return match.blue
        .support2;

    if (
      slotKey ===
      "red.tank"
    )
      return match.red
        .tank;

    if (
      slotKey ===
      "red.damage1"
    )
      return match.red
        .damage1;

    if (
      slotKey ===
      "red.damage2"
    )
      return match.red
        .damage2;

    if (
      slotKey ===
      "red.support1"
    )
      return match.red
        .support1;

    if (
      slotKey ===
      "red.support2"
    )
      return match.red
        .support2;

    if (
      slotKey ===
      "spectator.0"
    )
      return match
        .spectators[0];

    return match
      .spectators[1];
  }

  function setPlayerToSlot(
    match: MatchResult,
    slotKey: SlotKey,
    player: Player
  ): MatchResult {
    const next = {
      ...match,

      blue: {
        ...match.blue,
      },

      red: {
        ...match.red,
      },

      spectators: [
        ...match.spectators,
      ],
    };

    if (
      slotKey ===
      "blue.tank"
    )
      next.blue.tank =
        player;

    if (
      slotKey ===
      "blue.damage1"
    )
      next.blue.damage1 =
        player;

    if (
      slotKey ===
      "blue.damage2"
    )
      next.blue.damage2 =
        player;

    if (
      slotKey ===
      "blue.support1"
    )
      next.blue.support1 =
        player;

    if (
      slotKey ===
      "blue.support2"
    )
      next.blue.support2 =
        player;

    if (
      slotKey ===
      "red.tank"
    )
      next.red.tank =
        player;

    if (
      slotKey ===
      "red.damage1"
    )
      next.red.damage1 =
        player;

    if (
      slotKey ===
      "red.damage2"
    )
      next.red.damage2 =
        player;

    if (
      slotKey ===
      "red.support1"
    )
      next.red.support1 =
        player;

    if (
      slotKey ===
      "red.support2"
    )
      next.red.support2 =
        player;

    if (
      slotKey ===
      "spectator.0"
    )
      next.spectators[0] =
        player;

    if (
      slotKey ===
      "spectator.1"
    )
      next.spectators[1] =
        player;

    return recalcMatch(
      next
    );
  }

  function recalcMatch(
    match: MatchResult
  ): MatchResult {
    const blueTotal =
      match.blue.tank
        .tankPoint *
        TANK_WEIGHT +
      match.blue.damage1
        .damagePoint +
      match.blue.damage2
        .damagePoint +
      match.blue.support1
        .supportPoint +
      match.blue.support2
        .supportPoint;

    const redTotal =
      match.red.tank
        .tankPoint *
        TANK_WEIGHT +
      match.red.damage1
        .damagePoint +
      match.red.damage2
        .damagePoint +
      match.red.support1
        .supportPoint +
      match.red.support2
        .supportPoint;

    const teamDiff =
      Math.abs(
        blueTotal -
          redTotal
      );

    const pairDiff =
      Math.abs(
        match.blue.tank
          .tankPoint -
          match.red.tank
            .tankPoint
      ) *
        TANK_WEIGHT +
      Math.abs(
        match.blue.damage1
          .damagePoint -
          match.red.damage1
            .damagePoint
      ) +
      Math.abs(
        match.blue.damage2
          .damagePoint -
          match.red.damage2
            .damagePoint
      ) +
      Math.abs(
        match.blue.support1
          .supportPoint -
          match.red.support1
            .supportPoint
      ) +
      Math.abs(
        match.blue.support2
          .supportPoint -
          match.red.support2
            .supportPoint
      );

    return {
      ...match,

      teamDiff,

      pairDiff,

      score:
        teamDiff +
        pairDiff,
    };
  }

  function handleSlotClick(
    matchNo: number,
    slotKey: SlotKey
  ) {
    if (!swapMode) {
      return;
    }

    if (
      !selectedSlot
    ) {
      setSelectedSlot({
        matchNo,
        slotKey,
      });

      return;
    }

    if (
      selectedSlot.matchNo !==
      matchNo
    ) {
      setSelectedSlot({
        matchNo,
        slotKey,
      });

      return;
    }

    if (
      selectedSlot.slotKey ===
      slotKey
    ) {
      setSelectedSlot(
        null
      );

      return;
    }

    setResults(
      (prev) =>
        prev.map(
          (match) => {
            if (
              match.matchNo !==
              matchNo
            ) {
              return match;
            }

            const firstPlayer =
              getPlayerFromSlot(
                match,
                selectedSlot.slotKey
              );

            const secondPlayer =
              getPlayerFromSlot(
                match,
                slotKey
              );

            let next =
              setPlayerToSlot(
                match,
                selectedSlot.slotKey,
                secondPlayer
              );

            next =
              setPlayerToSlot(
                next,
                slotKey,
                firstPlayer
              );

            return next;
          }
        )
    );

    setSelectedSlot(
      null
    );
  }

  /* =========================
     UI
  ========================= */

  return (
  <main className="page">

    <section className="card">

      <section className="hero">

        <h1>
          Overwatch Team Maker
        </h1>

        <p>
          身内カスタムなどのチーム分けに使えます
        </p>

      </section>

      <h2>
        チームメンバー入力
      </h2>

        <div className="bulk">

          <label>

            一括ランク入力

            <RankSelect
              value={
                bulkRank
              }
              onChange={
                setBulkRank
              }
            />

          </label>

          <button
            onClick={
              applyBulkRank
            }
          >
            全員に適用
          </button>

          <button
            onClick={
              fillTestMembers
            }
          >
            テストデータ入力
          </button>

          <button
            onClick={
              clearSavedMembers
            }
          >
            入力をクリア
          </button>

        </div>

        <div className="tableWrap">

          <table className="memberTable">

            <thead>
              <tr>
                <th>
                  メンバー
                </th>

                <th>
                  タンク
                </th>

                <th>
                  ダメージ
                </th>

                <th>
                  サポート
                </th>

                <th>
                  一括
                </th>
              </tr>
            </thead>

            <tbody>

              {members.map(
                (
                  member,
                  index
                ) => (
                  <tr
                    key={
                      index
                    }
                  >

                    <td>
                      <input
                        value={
                          member.name
                        }
                        onChange={(
                          e
                        ) =>
                          updateMember(
                            index,
                            {
                              name:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder={`メンバー${
                          index +
                          1
                        }`}
                      />
                    </td>

                    <td>
                      <RankSelect
                        value={
                          member.tankRank
                        }
                        onChange={(
                          value
                        ) =>
                          updateMember(
                            index,
                            {
                              tankRank:
                                value,
                            }
                          )
                        }
                      />
                    </td>

                    <td>
                      <RankSelect
                        value={
                          member.damageRank
                        }
                        onChange={(
                          value
                        ) =>
                          updateMember(
                            index,
                            {
                              damageRank:
                                value,
                            }
                          )
                        }
                      />
                    </td>

                    <td>
                      <RankSelect
                        value={
                          member.supportRank
                        }
                        onChange={(
                          value
                        ) =>
                          updateMember(
                            index,
                            {
                              supportRank:
                                value,
                            }
                          )
                        }
                      />
                    </td>

                    <td>
                      <button
                        onClick={() =>
                          copyTankRank(
                            index
                          )
                        }
                      >
                        タンクを適用
                      </button>
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </section>

      <section className="card">

        <div className="tabs">

          <button
            className={
              tab ===
              "roleFixed"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab(
                "roleFixed"
              )
            }
          >
            ロール指定
          </button>

          <button
            className={
              tab ===
              "free"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab(
                "free"
              )
            }
          >
            ロール指定なし
          </button>

          <button
            className={
              tab ===
              "guide"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab(
                "guide"
              )
            }
          >
            使い方
          </button>

        </div>

        {tab ===
          "roleFixed" && (
          <div>

            <h2>
              ロール指定（12人、6試合）
            </h2>

            <p>
              全員が Tank 1回、Damage 2回、Support 2回、観戦 1回になるように分けます。
            </p>

            {isOver12 && (
              <p className="notice">
                ロール指定モードでは、メンバー表の上から12人を参照します。
              </p>
            )}

            <div className="actionRow">

              <button
                className="primary"
                onClick={
                  runRoleFixed
                }
              >
                チームを分ける
              </button>

              <button
                className={
                  showDetails
                    ? "dangerButton"
                    : ""
                }
                onClick={() =>
                  setShowDetails(
                    (
                      prev
                    ) =>
                      !prev
                  )
                }
              >
                {showDetails
                  ? "詳細表示ON"
                  : "詳細表示OFF"}
              </button>

              <button
                className={
                  swapMode
                    ? "dangerButton"
                    : ""
                }
                onClick={() => {
                  setSwapMode(
                    (
                      prev
                    ) =>
                      !prev
                  );

                  setSelectedSlot(
                    null
                  );
                }}
              >
                {swapMode
                  ? "入れ替えON"
                  : "入れ替えOFF"}
              </button>

            </div>

            {error && (
              <p className="error">
                {error}
              </p>
            )}

            {results.map(
              (
                match
              ) => (
                <section
                  className="result"
                  key={
                    match.matchNo
                  }
                >

                  <h3>
                    試合{" "}
                    {
                      match.matchNo
                    }
                  </h3>

                  <table>

                    <thead>
                      <tr>

                        <th className="blueHeader">
                          青ロール
                        </th>

                        <th className="blueHeader">
                          青メンバー
                        </th>

                        {showDetails && (
                          <th className="blueHeader">
                            青ランク
                          </th>
                        )}

                        <th />

                        <th className="redHeader">
                          赤ロール
                        </th>

                        <th className="redHeader">
                          赤メンバー
                        </th>

                        {showDetails && (
                          <th className="redHeader">
                            赤ランク
                          </th>
                        )}

                      </tr>
                    </thead>

                    <tbody>

                      <ResultRow
                        role="Tank"
                        blue={
                          match
                            .blue
                            .tank
                        }
                        red={
                          match
                            .red
                            .tank
                        }
                        rankKey="tankRank"
                        showDetails={
                          showDetails
                        }
                        blueSlotKey="blue.tank"
                        redSlotKey="red.tank"
                        matchNo={
                          match.matchNo
                        }
                        swapMode={
                          swapMode
                        }
                        selectedSlot={
                          selectedSlot
                        }
                        onSlotClick={
                          handleSlotClick
                        }
                      />

                      <ResultRow
                        role="Damage1"
                        blue={
                          match
                            .blue
                            .damage1
                        }
                        red={
                          match
                            .red
                            .damage1
                        }
                        rankKey="damageRank"
                        showDetails={
                          showDetails
                        }
                        blueSlotKey="blue.damage1"
                        redSlotKey="red.damage1"
                        matchNo={
                          match.matchNo
                        }
                        swapMode={
                          swapMode
                        }
                        selectedSlot={
                          selectedSlot
                        }
                        onSlotClick={
                          handleSlotClick
                        }
                      />

                      <ResultRow
                        role="Damage2"
                        blue={
                          match
                            .blue
                            .damage2
                        }
                        red={
                          match
                            .red
                            .damage2
                        }
                        rankKey="damageRank"
                        showDetails={
                          showDetails
                        }
                        blueSlotKey="blue.damage2"
                        redSlotKey="red.damage2"
                        matchNo={
                          match.matchNo
                        }
                        swapMode={
                          swapMode
                        }
                        selectedSlot={
                          selectedSlot
                        }
                        onSlotClick={
                          handleSlotClick
                        }
                        vs
                      />

                      <ResultRow
                        role="Support1"
                        blue={
                          match
                            .blue
                            .support1
                        }
                        red={
                          match
                            .red
                            .support1
                        }
                        rankKey="supportRank"
                        showDetails={
                          showDetails
                        }
                        blueSlotKey="blue.support1"
                        redSlotKey="red.support1"
                        matchNo={
                          match.matchNo
                        }
                        swapMode={
                          swapMode
                        }
                        selectedSlot={
                          selectedSlot
                        }
                        onSlotClick={
                          handleSlotClick
                        }
                      />

                      <ResultRow
                        role="Support2"
                        blue={
                          match
                            .blue
                            .support2
                        }
                        red={
                          match
                            .red
                            .support2
                        }
                        rankKey="supportRank"
                        showDetails={
                          showDetails
                        }
                        blueSlotKey="blue.support2"
                        redSlotKey="red.support2"
                        matchNo={
                          match.matchNo
                        }
                        swapMode={
                          swapMode
                        }
                        selectedSlot={
                          selectedSlot
                        }
                        onSlotClick={
                          handleSlotClick
                        }
                      />

                    </tbody>

                  </table>

                  <p>

                    <strong>
                      観戦：
                    </strong>

                    {match.spectators.map(
                      (
                        p,
                        index
                      ) => {
                        const slotKey =
                          `spectator.${index}` as SlotKey;

                        const isSelected =
                          selectedSlot?.matchNo ===
                            match.matchNo &&
                          selectedSlot.slotKey ===
                            slotKey;

                        return (
                          <span
                            key={
                              p.id
                            }
                            className={`
                              ${
                                swapMode
                                  ? "swapName"
                                  : ""
                              }

                              ${
                                isSelected
                                  ? "selectedCell"
                                  : ""
                              }
                            `}
                            onClick={() =>
                              handleSlotClick(
                                match.matchNo,
                                slotKey
                              )
                            }
                          >
                            {
                              p.name
                            }

                            {index ===
                            0
                              ? "、"
                              : ""}
                          </span>
                        );
                      }
                    )}

                  </p>

                  {showDetails && (
                    <div className="detailInfo">

                      <div>
                        <strong>
                          チーム差：
                        </strong>

                        {match.teamDiff.toFixed(
                          1
                        )}
                      </div>

                      <div>
                        <strong>
                          ペア差：
                        </strong>

                        {match.pairDiff.toFixed(
                          1
                        )}
                      </div>

                    </div>
                  )}

                </section>
              )
            )}

            {results.length >
              0 && (
              <section className="result">

                <h3>
                  担当回数一覧
                </h3>

                <table>

                  <thead>
                    <tr>
                      <th>
                        メンバー
                      </th>

                      <th>
                        Tank
                      </th>

                      <th>
                        Damage
                      </th>

                      <th>
                        Support
                      </th>

                      <th>
                        観戦
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {roleCounts.map(
                      (
                        count
                      ) => (
                        <tr
                          key={
                            count.name
                          }
                        >
                          <td>
                            {
                              count.name
                            }
                          </td>

                          <td>
                            {
                              count.tank
                            }
                          </td>

                          <td>
                            {
                              count.damage
                            }
                          </td>

                          <td>
                            {
                              count.support
                            }
                          </td>

                          <td>
                            {
                              count.spectator
                            }
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </section>
            )}

          </div>
        )}

        {tab ===
          "free" && (
          <div>

            <h2>
              ロール指定なし（10〜16人、任意の試合数）
            </h2>

            <p>
              この機能は次の拡張用です。メンバー表はそのまま維持されます。
            </p>

          </div>
        )}

        {tab ===
          "guide" && (
          <div>

            <h2>
              使い方
            </h2>

            <h3>
              〈ロール指定〉
            </h3>

            <p>
              メンバー表を12人以上入力してから「チームを分ける」を押してください。
              <br />
              13人以上入力されている場合、メンバー表の上から12人だけを使って計算します。
            </p>

            <h4>
              ■ ボタン説明
            </h4>

            <ul>

              <li>
                <strong>
                  全員に適用
                </strong>

                <br />

                一括ランク入力で選択したランクを、全メンバーの全ロールに適用します。
              </li>

              <li>
                <strong>
                  テストデータ入力
                </strong>

                <br />

                テスト用のメンバー名とランダムなランクを自動入力します。
              </li>

              <li>
                <strong>
                  タンクを適用
                </strong>

                <br />

                その行のタンクランクを、ダメージ・サポートにも適用します。
              </li>

              <li>
                <strong>
                  チームを分ける
                </strong>

                <br />

                チーム分けを実行します。
              </li>

              <li>
                <strong>
                  詳細表示 ON / OFF
                </strong>

                <br />

                ONにすると、各プレイヤーのランクやチーム分けの評価値などの詳細情報を表示します。

                <ul>
                  <li>
                    チーム差：青チームと赤チームの合計ランクポイント差
                  </li>

                  <li>
                    ペア差：同じロール同士（Tank・Damage・Support）のランクポイント差の合計
                  </li>
                </ul>
              </li>

              <li>
                <strong>
                  入れ替え ON / OFF
                </strong>

                <br />

                ONにすると、同じ試合内のメンバーをクリックして入れ替えることができます。
                入れ替え後はチーム差・ペア差・担当回数も自動で再計算されます。
              </li>

            </ul>

            <h4>
              ■ 計算仕様
            </h4>

            <ul>

              <li>
                12人・6試合固定でチーム分けを行います。
              </li>

              <li>
                各プレイヤーは Tank 1回、Damage 2回、Support 2回、観戦 1回になるように調整します。
              </li>

              <li>
                各試合で、同じロール同士のランクポイント差ができるだけ小さくなるようにペアを作成します。
              </li>

              <li>
                Tankは試合への影響を考慮し、ランクポイントを1.2倍で評価します。
              </li>

              <li>
                青チーム・赤チームの合計ランクポイント差が最も小さくなる組み合わせを選択します。
              </li>

              <li>
                多数の候補を生成し、6試合全体の総合スコアが最も良い結果を採用します。
              </li>

            </ul>

            <h4>
              ■ ランクポイント
            </h4>

            <p>
              ランクポイントはチーム分けの計算に使用する内部評価値です。
              Championを50として、各ディビジョンごとに1ポイントずつ下がります。
            </p>

            <p>
              EmeraldはDiamondとPlatinumの間として計算します。
            </p>

            <h3>
              〈ロール指定なし〉
            </h3>

            <p>
              今後実装予定
            </p>

          </div>
        )}

      </section>

    </main>
  );
}