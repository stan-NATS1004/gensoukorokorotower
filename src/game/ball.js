import * as THREE from "three";

// 生成した顔テクスチャのキャッシュ（キャラidごと）
const faceTextureCache = new Map();
const spriteTextureCache = new Map();
const texLoader = new THREE.TextureLoader();

// Canvasでシンプルなかわいい顔を描く（画像がない場合の代用）。
function makeFaceTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;

  // ほっぺ（薄いピンク）
  ctx.fillStyle = "rgba(255,150,170,0.55)";
  ctx.beginPath();
  ctx.arc(cx - 62, cy + 30, 26, 0, Math.PI * 2);
  ctx.arc(cx + 62, cy + 30, 26, 0, Math.PI * 2);
  ctx.fill();

  // 目
  ctx.fillStyle = "#3a3a3a";
  ctx.beginPath();
  ctx.arc(cx - 45, cy - 8, 20, 0, Math.PI * 2);
  ctx.arc(cx + 45, cy - 8, 20, 0, Math.PI * 2);
  ctx.fill();
  // 目のハイライト
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx - 38, cy - 15, 6, 0, Math.PI * 2);
  ctx.arc(cx + 52, cy - 15, 6, 0, Math.PI * 2);
  ctx.fill();

  // 口（にっこり）
  ctx.strokeStyle = "#5a3a3a";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy + 22, 26, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function getFallbackFaceTexture(character) {
  if (faceTextureCache.has(character.id)) {
    return faceTextureCache.get(character.id);
  }
  const tex = makeFaceTexture();
  faceTextureCache.set(character.id, tex);
  return tex;
}

// 正面スプライト画像を読み込む（背景透過済みPNG想定）。
function getSpriteTexture(character) {
  if (!character.sprite) return null;
  if (spriteTextureCache.has(character.sprite)) {
    return spriteTextureCache.get(character.sprite);
  }
  const url = `${import.meta.env.BASE_URL}images/characters/${character.sprite}`;
  const tex = texLoader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  spriteTextureCache.set(character.sprite, tex);
  return tex;
}

// 第1段の見た目:
//  - 立体的な色付き球体（光沢・陰影で丸みを出す）
//  - その手前に、常にカメラ正面を向く2D顔スプライトを重ねる
export function createBallMesh(character) {
  const group = new THREE.Group();

  const geo = new THREE.SphereGeometry(character.radius, 32, 24);
  const mat = new THREE.MeshPhysicalMaterial({
    color: character.color,
    roughness: 0.35,
    metalness: 0.0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.28,
  });
  const sphere = new THREE.Mesh(geo, mat);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  group.add(sphere);

  const spriteTex = getSpriteTexture(character) || getFallbackFaceTexture(character);
  const spriteMat = new THREE.SpriteMaterial({
    map: spriteTex,
    transparent: true,
    depthTest: false, // 球の内側にいるので深度で隠れないようにする
    depthWrite: false,
    opacity: 1,
  });
  const face = new THREE.Sprite(spriteMat);
  // 球の直径より少し小さめにして、縁の色付き球が見えるようにする
  const faceScale = character.radius * 1.72;
  face.scale.set(faceScale, faceScale, faceScale);
  // 中心に置く（親の回転で軌道しない）。Spriteは常にカメラ正面を向く
  face.position.set(0, 0, 0);
  face.renderOrder = 10;
  group.add(face);

  return group;
}
