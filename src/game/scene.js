import * as THREE from "three";
import { STAGE } from "./config.js";

// Three.js のシーン・カメラ・ライト・床・壁・ガイド・ゲームオーバーラインを構築する。
// カメラは固定の OrthographicCamera（正面やや上から見下ろす）。
export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#bfe9ff");

  // --- カメラ（Orthographic） ---
  // 表示したい縦範囲（床の少し下〜出現位置の少し上）を基準に frustum を決める。
  const viewTop = STAGE.spawnY + 0.6;
  const viewBottom = STAGE.floorY - 0.8;
  const midY = (viewTop + viewBottom) / 2;
  // 斜め見下ろし用の frustum 高さ（傾けた分、奥行きが縦に映るので少し広げる）
  const frustumHeight = (viewTop - viewBottom) * 1.18;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  // x軸まわりにだけ傾けることで、左右(x)は画面横方向のまま＝クリック位置の対応が崩れない
  camera.position.set(0, midY + 5.4, 11);
  camera.lookAt(0, midY - 0.6, 0);

  // --- ライト ---
  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(3, 10, 6);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 30;
  dir.shadow.camera.left = -4;
  dir.shadow.camera.right = 4;
  dir.shadow.camera.top = 8;
  dir.shadow.camera.bottom = -2;
  scene.add(dir);

  // --- 床 ---
  const floorGeo = new THREE.BoxGeometry(STAGE.width, 0.4, STAGE.depth);
  const floorMat = new THREE.MeshStandardMaterial({ color: "#ffe1a8" });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, STAGE.floorY - 0.2, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // --- 左右の壁（薄い色・半透明） ---
  const wallHeight = STAGE.spawnY + 1.5;
  const wallMat = new THREE.MeshStandardMaterial({
    color: "#a8d8ff",
    transparent: true,
    opacity: 0.28,
  });
  const wallGeo = new THREE.BoxGeometry(0.15, wallHeight, STAGE.depth);

  const leftWall = new THREE.Mesh(wallGeo, wallMat);
  leftWall.position.set(STAGE.leftWall - 0.075, wallHeight / 2, 0);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeo, wallMat);
  rightWall.position.set(STAGE.rightWall + 0.075, wallHeight / 2, 0);
  scene.add(rightWall);

  // --- ゲームオーバーライン ---
  const lineMat = new THREE.MeshBasicMaterial({
    color: "#ff5b6e",
    transparent: true,
    opacity: 0.5,
  });
  const lineGeo = new THREE.BoxGeometry(STAGE.width + 0.4, 0.04, 0.02);
  const overLine = new THREE.Mesh(lineGeo, lineMat);
  overLine.position.set(0, STAGE.gameOverLine, STAGE.frontWall + 0.05);
  scene.add(overLine);

  // 破線風の点を並べてラインを目立たせる
  const dashGroup = new THREE.Group();
  const dashMat = new THREE.MeshBasicMaterial({ color: "#ff8fa3" });
  for (let x = -1.8; x <= 1.8; x += 0.3) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.06, 0.02),
      dashMat
    );
    dash.position.set(x, STAGE.gameOverLine, STAGE.frontWall + 0.06);
    dashGroup.add(dash);
  }
  scene.add(dashGroup);

  // --- 落下位置ガイド（縦の薄い線） ---
  const guideMat = new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.45,
  });
  const guide = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, STAGE.spawnY, 0.02),
    guideMat
  );
  guide.position.set(0, STAGE.spawnY / 2, STAGE.frontWall + 0.04);
  scene.add(guide);

  return {
    renderer,
    scene,
    camera,
    guide,
    viewTop,
    viewBottom,
    resize: () => resize(renderer, camera, canvas, frustumHeight),
  };
}

// キャンバスのアスペクト比に合わせて Orthographic frustum を更新する。
function resize(renderer, camera, canvas, frustumHeight) {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);

  const aspect = w / h;
  const halfH = frustumHeight / 2;
  const halfW = halfH * aspect;

  camera.top = halfH;
  camera.bottom = -halfH;
  camera.left = -halfW;
  camera.right = halfW;
  camera.updateProjectionMatrix();
}
