// キャラ玉データ。MVPでは色付き球で代用する（textureは未指定）。
// public/images/characters に画像を置き、texture にファイル名を設定すれば
// 後から顔画像に差し替えられる構造にしている。
// 性能差は調整が難しいため、MVPでは radius / mass を統一している。

export const CHARACTERS = [
  {
    id: "reimu",
    name: "霊夢",
    radius: 0.45,
    mass: 1,
    texture: null,
    color: "#ff5b6e",
    description: "博麗神社の巫女さん",
  },
  {
    id: "marisa",
    name: "魔理沙",
    radius: 0.45,
    mass: 1,
    texture: null,
    color: "#ffd43b",
    description: "普通の魔法使い",
  },
  {
    id: "cirno",
    name: "チルノ",
    radius: 0.45,
    mass: 1,
    texture: null,
    color: "#4dc3ff",
    description: "氷の妖精",
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
    radius: 0.45,
    mass: 1,
    texture: null,
    color: "#c9d3dd",
    description: "紅魔館のメイド長",
  },
];

export function pickRandomCharacter() {
  const i = Math.floor(Math.random() * CHARACTERS.length);
  return CHARACTERS[i];
}
