import * as THREE from "three";

// 生成した顔テクスチャのキャッシュ（キャラidごと）
const faceTextureCache = new Map();
const loadedTextureCache = new Map();
const texLoader = new THREE.TextureLoader();

// Canvasでシンプルなかわいい顔を描く（画像がない場合の代用）。
function makeFaceTexture(color) {
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

function getFaceTexture(character) {
  if (faceTextureCache.has(character.id)) {
    return faceTextureCache.get(character.id);
  }
  const tex = makeFaceTexture(character.color);
  faceTextureCache.set(character.id, tex);
  return tex;
}

// texture が指定されていれば画像を読み込む。なければ null を返す。
function getImageTexture(character) {
  if (!character.texture) return null;
  if (loadedTextureCache.has(character.texture)) {
    return loadedTextureCache.get(character.texture);
  }
  const url = `${import.meta.env.BASE_URL}images/characters/${character.texture}`;
  const tex = texLoader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  loadedTextureCache.set(character.texture, tex);
  return tex;
}

// キャラ玉の見た目（球体 + 正面の顔ビルボード）を作る。
export function createBallMesh(character) {
  const group = new THREE.Group();

  const geo = new THREE.SphereGeometry(character.radius, 24, 20);
  const mat = new THREE.MeshStandardMaterial({
    color: character.color,
    roughness: 0.55,
    metalness: 0.0,
  });
  const sphere = new THREE.Mesh(geo, mat);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  group.add(sphere);

  // 顔ビルボード（常にカメラを向く Sprite）。
  const faceTex = getImageTexture(character) || getFaceTexture(character);
  const spriteMat = new THREE.SpriteMaterial({
    map: faceTex,
    transparent: true,
    depthWrite: false,
  });
  const face = new THREE.Sprite(spriteMat);
  const faceScale = character.radius * 1.7;
  face.scale.set(faceScale, faceScale, faceScale);
  // 球の少し手前に出して埋もれないようにする
  face.position.set(0, 0, character.radius * 0.85);
  group.add(face);

  return group;
}
