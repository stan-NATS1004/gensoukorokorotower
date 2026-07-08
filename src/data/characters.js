// キャラ玉データ。MVPでは色付き球で代用する（textureは未指定）。
// public/images/characters に画像を置き、texture にファイル名を設定すれば
// 後から顔画像に差し替えられる構造にしている。
// 玉ごとにサイズ(radius)を変えており、大きい玉ほど早く箱が埋まる。
// mass は体積(半径の3乗)にほぼ比例させ、大きい玉ほど重い。

export const CHARACTERS = [
  {
    id: "cirno",
    name: "チルノ",
    radius: 0.3,
    mass: 0.3,
    texture: null,
    color: "#4dc3ff",
    description: "氷の妖精（小さい玉）",
  },
  {
    id: "marisa",
    name: "魔理沙",
    radius: 0.38,
    mass: 0.6,
    texture: null,
    color: "#ffd43b",
    description: "普通の魔法使い",
  },
  {
    id: "youmu",
    name: "妖夢",
    radius: 0.45,
    mass: 1,
    texture: null,
    color: "#8fe3b0",
    description: "半分幽霊の庭師",
  },
  {
    id: "sakuya",
    name: "咲夜",
    radius: 0.52,
    mass: 1.5,
    texture: null,
    color: "#c9d3dd",
    description: "紅魔館のメイド長",
  },
  {
    id: "reimu",
    name: "霊夢",
    radius: 0.6,
    mass: 2.4,
    texture: null,
    color: "#ff5b6e",
    description: "博麗神社の巫女さん（大きい玉）",
  },
];

export function pickRandomCharacter() {
  const i = Math.floor(Math.random() * CHARACTERS.length);
  return CHARACTERS[i];
}
