// キャラ玉データ（東方ゆっくり風）。
// sprite … 常に正面を向く2D顔画像（球の手前に重ねる）
// color  … 立体的な色付き球体の色
// どちらも public/images/characters/ に配置。
// 玉ごとにサイズ(radius)を変えており、大きい玉ほど早く箱が埋まる。
// mass は体積(半径の3乗)にほぼ比例させ、大きい玉ほど重い。

export const CHARACTERS = [
  {
    id: "cirno",
    name: "チルノ",
    radius: 0.3,
    mass: 0.3,
    sprite: "cirno_face.png",
    color: "#43b5dc",
    description: "氷の妖精（小さい玉）",
  },
  {
    id: "alice",
    name: "アリス",
    radius: 0.34,
    mass: 0.42,
    sprite: "alice_face.png",
    color: "#f0c84a",
    description: "七色の人形使い",
  },
  {
    id: "marisa",
    name: "魔理沙",
    radius: 0.38,
    mass: 0.6,
    sprite: "marisa_face.png",
    color: "#3a3530",
    description: "普通の魔法使い",
  },
  {
    id: "youmu",
    name: "妖夢",
    radius: 0.42,
    mass: 0.85,
    sprite: "youmu_face.png",
    color: "#6fa88a",
    description: "半分幽霊の庭師",
  },
  {
    id: "sakuya",
    name: "咲夜",
    radius: 0.46,
    mass: 1.15,
    sprite: "sakuya_face.png",
    color: "#5a7eb8",
    description: "紅魔館のメイド長",
  },
  {
    id: "patchouli",
    name: "パチュリー",
    radius: 0.5,
    mass: 1.45,
    sprite: "patchouli_face.png",
    color: "#9b6bb8",
    description: "知識と日陰の魔女",
  },
  {
    id: "yuyuko",
    name: "幽々子",
    radius: 0.53,
    mass: 1.75,
    sprite: "yuyuko_face.png",
    color: "#e89bb8",
    description: "華胥の亡霊",
  },
  {
    id: "remilia",
    name: "レミリア",
    radius: 0.56,
    mass: 2.05,
    sprite: "remilia_face.png",
    color: "#c45a8a",
    description: "紅い悪魔",
  },
  {
    id: "flandre",
    name: "フランドール",
    radius: 0.58,
    mass: 2.25,
    sprite: "flandre_face.png",
    color: "#e8c040",
    description: "悪魔の妹",
  },
  {
    id: "reimu",
    name: "霊夢",
    radius: 0.6,
    mass: 2.4,
    sprite: "reimu_face.png",
    color: "#c93d43",
    description: "博麗神社の巫女さん（大きい玉）",
  },
];

export function pickRandomCharacter() {
  const i = Math.floor(Math.random() * CHARACTERS.length);
  return CHARACTERS[i];
}
