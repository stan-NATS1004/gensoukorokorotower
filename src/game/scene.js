import * as THREE from "three";
import { STAGE } from "./config.js";

// Three.js のシーン・カメラ・ライト・床・壁・目標マーカー・ゲームオーバーラインを構築する。
// カメラは2つの視点を切り替えられる:
//   - "side": 斜め見下ろし（タワーの高さが見える）
//   - "top" : 真上から見下ろす（床の前後・左右の置き場所が見える）
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

  // 表示範囲の基準
  const viewTop = STAGE.spawnY + 0.6;
  const viewBottom = STAGE.floorY - 0.8;
  const midY = (viewTop + viewBottom) / 2;

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

  // 視点ごとのカメラ設定と frustum の合わせ方
  const VIEWS = {
    side: {
      pos: [0, midY + 5.4, 11],
      look: [0, midY - 0.6, 0],
      up: [0, 1, 0],
      fit: { mode: "height", value: (viewTop - viewBottom) * 1.18 },
    },
    top: {
      pos: [0, 18, 0.0001],
      look: [0, 0, 0],
      up: [0, 0, -1],
      fit: { mode: "width", value: STAGE.width + 1.0 },
    },
  };

  const state = { mode: "side" };

  function setView(mode) {
    const v = VIEWS[mode] || VIEWS.side;
    state.mode = VIEWS[mode] ? mode : "side";
    camera.up.set(v.up[0], v.up[1], v.up[2]);
    camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
    camera.lookAt(v.look[0], v.look[1], v.look[2]);
    doResize();
  }

  // --- ライト ---
  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(3, 12, 6);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 40;
  dir.shadow.camera.left = -4;
  dir.shadow.camera.right = 4;
  dir.shadow.camera.top = 8;
  dir.shadow.camera.bottom = -4;
  scene.add(dir);

  // --- 床 ---
  const floorGeo = new THREE.BoxGeometry(STAGE.width, 0.4, STAGE.depth);
  const floorMat = new THREE.MeshStandardMaterial({ color: "#ffe1a8" });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, STAGE.floorY - 0.2, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // 床の上面に薄いマス目（真上視点で前後左右が分かりやすいように）
  const grid = new THREE.GridHelper(
    Math.max(STAGE.width, STAGE.depth),
    8,
    0xffffff,
    0xffffff
  );
  grid.scale.set(STAGE.width / Math.max(STAGE.width, STAGE.depth), 1, STAGE.depth / Math.max(STAGE.width, STAGE.depth));
  grid.position.set(0, STAGE.floorY + 0.01, 0);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

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
  const lineGeo = new THREE.BoxGeometry(STAGE.width + 0.4, 0.04, STAGE.depth);
  const overLine = new THREE.Mesh(lineGeo, lineMat);
  overLine.position.set(0, STAGE.gameOverLine, 0);
  overLine.material.opacity = 0.26;
  scene.add(overLine);

  const dashGroup = new THREE.Group();
  const dashMat = new THREE.MeshBasicMaterial({ color: "#ff8fa3" });
  for (let x = -1.8; x <= 1.8; x += 0.3) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.02), dashMat);
    dash.position.set(x, STAGE.gameOverLine, STAGE.frontWall + 0.06);
    dashGroup.add(dash);
  }
  scene.add(dashGroup);

  // --- 落下目標マーカー（床に置くリング） ---
  const targetRing = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.4, 28),
    new THREE.MeshBasicMaterial({
      color: "#ff5b8f",
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    })
  );
  targetRing.rotation.x = -Math.PI / 2;
  targetRing.position.set(0, STAGE.floorY + 0.03, 0);
  scene.add(targetRing);

  function doResize() {
    resize(renderer, camera, canvas, VIEWS[state.mode].fit);
  }

  // 初期視点
  setView("side");

  return {
    renderer,
    scene,
    camera,
    target: targetRing,
    viewTop,
    viewBottom,
    getViewMode: () => state.mode,
    setView,
    toggleView: () => setView(state.mode === "side" ? "top" : "side"),
    resize: doResize,
  };
}

// キャンバスのアスペクト比に合わせて Orthographic frustum を更新する。
// fit.mode が "width" のときは横幅基準、"height" のときは縦基準で合わせる。
function resize(renderer, camera, canvas, fit) {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);

  const aspect = w / h;
  let halfW;
  let halfH;
  if (fit.mode === "width") {
    halfW = fit.value / 2;
    halfH = halfW / aspect;
  } else {
    halfH = fit.value / 2;
    halfW = halfH * aspect;
  }

  camera.top = halfH;
  camera.bottom = -halfH;
  camera.left = -halfW;
  camera.right = halfW;
  camera.updateProjectionMatrix();
}
