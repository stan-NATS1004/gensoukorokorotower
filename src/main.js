import "./style.css";
import * as THREE from "three";
import {
  STAGE,
  PHYSICS,
  RULES,
  getRank,
  STORAGE_KEYS,
} from "./game/config.js";
import { createScene } from "./game/scene.js";
import { createPhysics, createSphereBody } from "./game/physics.js";
import { createBallMesh } from "./game/ball.js";
import { pickRandomCharacter } from "./data/characters.js";
import { createUI } from "./ui/ui.js";

const canvas = document.getElementById("game-canvas");
const ui = createUI();

const view = createScene(canvas);
const physics = createPhysics();

// すべてのイベント登録をまとめて解除できるようにする（HMRでの多重登録防止）
const listenerAC = new AbortController();
const listenerOpts = { signal: listenerAC.signal };
let rafId = 0;

// ===== ゲーム状態 =====
const State = {
  READY: "ready", // スタート前
  PLAYING: "playing",
  GAMEOVER: "gameover",
};

const game = {
  state: State.READY,
  score: 0,
  highScore: loadHighScore(),
  balls: [], // { group, body, radius, dropTime, overSince }
  waitingBall: null, // { group, character, x }
  nextCharacter: null,
  canDrop: true,
  lastTime: performance.now(),
};

ui.setHighScore(game.highScore);
ui.setRankProgress(0);

// ===== 初期化 =====
function resizeAll() {
  view.resize();
}
window.addEventListener("resize", resizeAll, listenerOpts);
resizeAll();

// ===== 待機球の準備 =====
function prepareWaitingBall() {
  const character = game.nextCharacter || pickRandomCharacter();
  game.nextCharacter = pickRandomCharacter();

  const group = createBallMesh(character);
  const x = 0;
  const z = 0;
  group.position.set(x, STAGE.spawnY, z);
  view.scene.add(group);

  game.waitingBall = { group, character, x, z };
  updateTarget(x, z);
  ui.setNextPreview(game.nextCharacter);
}

// 床の落下目標マーカーと落下ガイドを (x, z) に動かす
function updateTarget(x, z) {
  view.target.position.x = x;
  view.target.position.z = z;
  view.dropGuide.position.x = x;
  view.dropGuide.position.z = z;
}

// 目標マーカー・ガイドの表示切り替え
function setAimVisible(visible) {
  view.target.visible = visible;
  view.dropGuide.visible = visible;
}

// ===== 待機球の移動（キーボード用） =====
function moveWaiting(dx, dz) {
  if (game.state !== State.PLAYING || !game.waitingBall) return;
  aimTo(game.waitingBall.x + dx * STAGE.moveStep, game.waitingBall.z + dz * STAGE.moveStep);
}

// 待機球を指定 (x, z)（ワールド座標）に合わせる。z は球の半径ぶん内側に制限。
function aimTo(worldX, worldZ) {
  if (game.state !== State.PLAYING || !game.waitingBall) return;
  const r = game.waitingBall.character.radius;
  const nx = clamp(worldX, STAGE.moveMinX, STAGE.moveMaxX);
  const zLimit = Math.max(0, STAGE.frontWall - r - 0.02);
  const nz = clamp(worldZ, -zLimit, zLimit);
  game.waitingBall.x = nx;
  game.waitingBall.z = nz;
  game.waitingBall.group.position.x = nx;
  game.waitingBall.group.position.z = nz;
  updateTarget(nx, nz);
}

// 画面上の座標を、床(y=0)平面上のワールド座標へ変換する（レイキャスト）。
const _raycaster = new THREE.Raycaster();
const _floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -STAGE.floorY);
const _ndc = new THREE.Vector2();
const _hit = new THREE.Vector3();
function clientToFloor(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  _raycaster.setFromCamera(_ndc, view.camera);
  const hit = _raycaster.ray.intersectPlane(_floorPlane, _hit);
  return hit ? { x: _hit.x, z: _hit.z } : null;
}

// ===== 落下 =====
function dropBall() {
  if (game.state !== State.PLAYING) return;
  if (!game.canDrop || !game.waitingBall) return;

  // 球数上限チェック
  if (game.balls.length >= RULES.maxBalls) {
    triggerGameOver();
    return;
  }

  const { group, character, x, z } = game.waitingBall;
  const body = createSphereBody(
    physics.sphereMat,
    character.radius,
    character.mass,
    x,
    STAGE.spawnY,
    z
  );
  physics.world.addBody(body);

  const ball = {
    group,
    body,
    radius: character.radius,
    dropTime: performance.now(),
    overSince: null,
  };
  game.balls.push(ball);
  game.waitingBall = null;

  // スコア = 落とした球の個数
  game.score += 1;
  ui.setScore(game.score);
  ui.hideHint();

  // クールダウン後に次の球を準備
  game.canDrop = false;
  setTimeout(() => {
    if (game.state !== State.PLAYING) return;
    prepareWaitingBall();
    game.canDrop = true;
  }, RULES.dropCooldownMs);
}

// ===== 物理と表示の同期 & 各種判定 =====
function update(now) {
  const dt = Math.min((now - game.lastTime) / 1000, 0.05);
  game.lastTime = now;

  if (game.state === State.PLAYING) {
    physics.world.step(PHYSICS.fixedTimeStep, dt, PHYSICS.maxSubSteps);
    syncBalls(now);
    checkGameOver(now);
  }

  view.renderer.render(view.scene, view.camera);
  rafId = requestAnimationFrame(update);
}

function syncBalls(now) {
  for (let i = game.balls.length - 1; i >= 0; i--) {
    const ball = game.balls[i];
    ball.group.position.copy(ball.body.position);
    ball.group.quaternion.copy(ball.body.quaternion);

    // 範囲外に落ちた球は除去
    if (ball.body.position.y < RULES.outOfBoundsY) {
      removeBall(i);
    }
  }
}

function removeBall(index) {
  const ball = game.balls[index];
  physics.world.removeBody(ball.body);
  view.scene.remove(ball.group);
  disposeGroup(ball.group);
  game.balls.splice(index, 1);
}

// ===== ゲームオーバー判定 =====
function checkGameOver(now) {
  let longestOverMs = -1; // ライン超過中の最長経過時間

  for (const ball of game.balls) {
    // 落下直後の球は判定対象にしない
    if (now - ball.dropTime < RULES.judgeDelayMs) {
      ball.overSince = null;
      continue;
    }
    const topY = ball.body.position.y + ball.radius;
    if (topY > STAGE.gameOverLine) {
      if (ball.overSince === null) ball.overSince = now;
      const elapsed = now - ball.overSince;
      if (elapsed >= RULES.gameOverGraceMs) {
        triggerGameOver();
        return;
      }
      longestOverMs = Math.max(longestOverMs, elapsed);
    } else {
      // ライン下に戻ったらカウントリセット
      ball.overSince = null;
    }
  }

  // 超過中なら「あぶない！あとN秒」を表示、そうでなければ隠す
  if (longestOverMs >= 0) {
    const remain = Math.max(0, RULES.gameOverGraceMs - longestOverMs);
    ui.showDanger(Math.ceil(remain / 1000));
  } else {
    ui.hideDanger();
  }
}

function triggerGameOver() {
  if (game.state !== State.PLAYING) return;
  game.state = State.GAMEOVER;
  game.canDrop = false;
  ui.hideHint();
  ui.hideDanger();
  setAimVisible(false);

  // 待機球を消す
  if (game.waitingBall) {
    view.scene.remove(game.waitingBall.group);
    disposeGroup(game.waitingBall.group);
    game.waitingBall = null;
  }

  const rank = getRank(game.score);
  if (game.score > game.highScore) {
    game.highScore = game.score;
    ui.setHighScore(game.highScore);
  }
  saveResult(game.score, game.highScore, rank);
  ui.showGameOver(game.score, game.highScore, rank);
}

// ===== ゲーム開始・リスタート =====
function startGame() {
  // 既存の球を全消去
  for (let i = game.balls.length - 1; i >= 0; i--) removeBall(i);
  if (game.waitingBall) {
    view.scene.remove(game.waitingBall.group);
    disposeGroup(game.waitingBall.group);
    game.waitingBall = null;
  }

  game.score = 0;
  game.nextCharacter = null;
  game.canDrop = true;
  game.state = State.PLAYING;
  ui.setScore(0);
  ui.hideStart();
  ui.hideGameOver();
  ui.hideDanger();
  updateHintForView();
  ui.showHint();
  setAimVisible(true);
  prepareWaitingBall();
}

// ===== localStorage =====
function loadHighScore() {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEYS.highScore) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function saveResult(score, highScore, rank) {
  try {
    localStorage.setItem(STORAGE_KEYS.highScore, String(highScore));
    localStorage.setItem(STORAGE_KEYS.lastScore, String(score));
    localStorage.setItem(STORAGE_KEYS.lastRank, rank);
    localStorage.setItem(STORAGE_KEYS.lastPlayedAt, new Date().toISOString());
  } catch {
    // localStorage が使えない環境では何もしない
  }
}

// ===== 入力（画面クリック / タップ） =====
// 画面上でポインタを動かすと待機球が「床のその位置(x,z)」へ移動し、
// クリック / タップで球を落とす（PC・スマホ共通）。
// 斜め視点でも真上視点でも、床平面へのレイキャストで位置が決まる。
let pointerActive = false;

function aimFromEvent(e) {
  const p = clientToFloor(e.clientX, e.clientY);
  if (p) aimTo(p.x, p.z);
}

canvas.addEventListener(
  "pointerdown",
  (e) => {
    e.preventDefault();
    pointerActive = true;
    aimFromEvent(e);
  },
  listenerOpts
);

canvas.addEventListener(
  "pointermove",
  (e) => {
    if (game.state !== State.PLAYING) return;
    // PCはホバーで狙いを合わせ、スマホはドラッグで合わせる
    if (e.pointerType === "mouse" || pointerActive) aimFromEvent(e);
  },
  listenerOpts
);

canvas.addEventListener(
  "pointerup",
  (e) => {
    e.preventDefault();
    if (pointerActive) {
      aimFromEvent(e);
      dropBall();
    }
    pointerActive = false;
  },
  listenerOpts
);

canvas.addEventListener(
  "pointercancel",
  () => {
    // スマホの画面端スワイプ等でポインタがキャンセルされても、
    // 直前に狙った位置へそのまま落とす（右端タップが無効化される問題対策）。
    if (pointerActive) dropBall();
    pointerActive = false;
  },
  listenerOpts
);

// 視点切り替え
ui.el.viewBtn.addEventListener(
  "click",
  () => {
    view.toggleView();
    ui.setViewLabel(view.getViewMode());
    updateHintForView();
  },
  listenerOpts
);

ui.el.startBtn.addEventListener("click", startGame, listenerOpts);
ui.el.restartBtn.addEventListener("click", startGame, listenerOpts);

function updateHintForView() {
  ui.setHintText(
    view.getViewMode() === "top"
      ? "床をタップして置く位置を決めよう"
      : "画面をタップして落とそう"
  );
}

// ===== 入力（キーボード） =====
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      moveWaiting(-1, 0);
      break;
    case "ArrowRight":
      e.preventDefault();
      moveWaiting(1, 0);
      break;
    case "ArrowUp":
      e.preventDefault();
      moveWaiting(0, -1); // 奥へ
      break;
    case "ArrowDown":
      e.preventDefault();
      moveWaiting(0, 1); // 手前へ
      break;
    case " ":
    case "Spacebar":
      e.preventDefault();
      if (game.state === State.READY) startGame();
      else dropBall();
      break;
    case "r":
    case "R":
      if (game.state !== State.READY) startGame();
      break;
    case "v":
    case "V":
      view.toggleView();
      ui.setViewLabel(view.getViewMode());
      updateHintForView();
      break;
    default:
      break;
  }
}, listenerOpts);

// ===== ユーティリティ =====
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function disposeGroup(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
}

// ===== 起動 =====
ui.setViewLabel(view.getViewMode());
setAimVisible(false);
game.lastTime = performance.now();
rafId = requestAnimationFrame(update);

// 開発時(HMR)に古いループ・イベント登録が残らないようにする（本番ビルドには影響なし）
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cancelAnimationFrame(rafId);
    listenerAC.abort();
  });
}
