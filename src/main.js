import "./style.css";
import * as THREE from "three";
import {
  STAGE,
  PHYSICS,
  RULES,
  SPAWN_Z_JITTER,
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

// ===== 初期化 =====
function resizeAll() {
  view.resize();
}
window.addEventListener("resize", resizeAll);
resizeAll();

// ===== 待機球の準備 =====
function prepareWaitingBall() {
  const character = game.nextCharacter || pickRandomCharacter();
  game.nextCharacter = pickRandomCharacter();

  const group = createBallMesh(character);
  const x = 0;
  // 奥行き方向に少しばらつかせて立体的な山にする
  const z = (Math.random() * 2 - 1) * SPAWN_Z_JITTER;
  group.position.set(x, STAGE.spawnY, z);
  view.scene.add(group);

  game.waitingBall = { group, character, x, z };
  updateGuide(x);
  ui.setNextPreview(game.nextCharacter.color);
}

function updateGuide(x) {
  view.guide.position.x = x;
}

// ===== 待機球の左右移動（キーボード用） =====
function moveWaiting(dir) {
  if (game.state !== State.PLAYING || !game.waitingBall) return;
  aimTo(game.waitingBall.x + dir * STAGE.moveStep);
}

// 待機球を指定x（ワールド座標）に合わせる
function aimTo(worldX) {
  if (game.state !== State.PLAYING || !game.waitingBall) return;
  const nx = clamp(worldX, STAGE.moveMinX, STAGE.moveMaxX);
  game.waitingBall.x = nx;
  game.waitingBall.group.position.x = nx;
  updateGuide(nx);
}

// 画面上のx座標をワールドx座標へ変換する
function clientXToWorldX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const frac = (clientX - rect.left) / rect.width;
  const worldWidth = view.camera.right - view.camera.left;
  return view.camera.left + frac * worldWidth;
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
  requestAnimationFrame(update);
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
  for (const ball of game.balls) {
    // 落下直後の球は判定対象にしない
    if (now - ball.dropTime < RULES.judgeDelayMs) {
      ball.overSince = null;
      continue;
    }
    const topY = ball.body.position.y + ball.radius;
    if (topY > STAGE.gameOverLine) {
      if (ball.overSince === null) ball.overSince = now;
      if (now - ball.overSince >= RULES.gameOverGraceMs) {
        triggerGameOver();
        return;
      }
    } else {
      // ライン下に戻ったらカウントリセット
      ball.overSince = null;
    }
  }
}

function triggerGameOver() {
  if (game.state !== State.PLAYING) return;
  game.state = State.GAMEOVER;
  game.canDrop = false;
  ui.hideHint();

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
  ui.showHint();
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
// 画面上でポインタを動かすと待機球が横に移動し、
// クリック / タップで球を落とす（PC・スマホ共通）。
let pointerActive = false;

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  pointerActive = true;
  aimTo(clientXToWorldX(e.clientX));
});

canvas.addEventListener("pointermove", (e) => {
  // PCはホバーで狙いを合わせ、スマホはドラッグで合わせる
  if (game.state !== State.PLAYING) return;
  if (e.pointerType === "mouse" || pointerActive) {
    aimTo(clientXToWorldX(e.clientX));
  }
});

canvas.addEventListener("pointerup", (e) => {
  e.preventDefault();
  if (pointerActive) {
    aimTo(clientXToWorldX(e.clientX));
    dropBall();
  }
  pointerActive = false;
});

canvas.addEventListener("pointercancel", () => {
  pointerActive = false;
});

ui.el.startBtn.addEventListener("click", startGame);
ui.el.restartBtn.addEventListener("click", startGame);

// ===== 入力（キーボード） =====
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      moveWaiting(-1);
      break;
    case "ArrowRight":
      e.preventDefault();
      moveWaiting(1);
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
    default:
      break;
  }
});

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
game.lastTime = performance.now();
requestAnimationFrame(update);
