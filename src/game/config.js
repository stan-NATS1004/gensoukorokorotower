// ゲーム全体の設定値。仕様書の寸法・物理値をここに集約する。

export const STAGE = {
  width: 4.0, // 横幅
  depth: 2.0, // 奥行き
  leftWall: -2.0, // 左壁 x
  rightWall: 2.0, // 右壁 x
  frontWall: 1.0, // 手前壁 z
  backWall: -1.0, // 奥壁 z
  floorY: 0, // 床の高さ
  gameOverLine: 5.5, // ゲームオーバーライン y
  spawnY: 6.2, // 球の出現位置 y
  moveMinX: -1.5, // 落下位置の移動範囲 左
  moveMaxX: 1.5, // 落下位置の移動範囲 右
  moveMinZ: -0.7, // 落下位置の移動範囲 奥
  moveMaxZ: 0.7, // 落下位置の移動範囲 手前
  moveStep: 0.2, // キーボード1回の移動量
};

export const PHYSICS = {
  gravity: -6,
  fixedTimeStep: 1 / 60,
  maxSubSteps: 3,
  sphereMass: 1,
  // 転がって片側に崩れないよう、安定寄りに調整（跳ねにくく・転がりにくく）
  sphereRestitution: 0.08,
  sphereFriction: 0.95,
  floorFriction: 1.0,
  wallFriction: 0.6,
  linearDamping: 0.25,
  angularDamping: 0.55,
};

export const RULES = {
  dropCooldownMs: 800, // 落下後、次の球を落とせない時間
  maxBalls: 80, // 球数上限
  judgeDelayMs: 1500, // 落下後この時間は判定対象にしない（落下中の即終了を防ぐ）
  gameOverGraceMs: 0, // ラインを超えたら即終了（猶予なし）
  outOfBoundsY: -5, // これより下に落ちた球は除去
};

// 必要数は物理シミュレーションで計測した収容数を基に設定。
// 雑に落とすだけでは平均36・最大42個ほどで終わるため、
// 咲夜級(40)以上は丁寧に積む必要があり、霊夢級(50)はほぼ満杯まで積む挑戦。
export const RANKS = [
  { name: "チルノ級", min: 0 },
  { name: "アリス級", min: 15 },
  { name: "妖夢級", min: 28 },
  { name: "咲夜級", min: 40 },
  { name: "霊夢級", min: 50 },
];

export function getRank(score) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (score >= r.min) rank = r;
  }
  return rank.name;
}

// 現在のランク段階・現在地・次のランクまでの残り数などをまとめて返す。
export function getRankInfo(score) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (score >= RANKS[i].min) index = i;
  }
  const current = RANKS[index];
  const next = RANKS[index + 1] || null;
  const isMax = !next;
  const toNext = next ? next.min - score : 0;
  return {
    index,
    name: current.name,
    min: current.min,
    total: RANKS.length,
    next,
    toNext,
    isMax,
  };
}

export const STORAGE_KEYS = {
  highScore: "gensoTowerHighScore",
  lastScore: "gensoTowerLastScore",
  lastRank: "gensoTowerLastRank",
  lastPlayedAt: "gensoTowerLastPlayedAt",
};
