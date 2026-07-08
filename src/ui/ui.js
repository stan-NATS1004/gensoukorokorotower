import { RANKS, getRankInfo } from "../game/config.js";

// ランク段階を表す小さなステップ列を container に描画する。
// score に応じて「達成済み / 今ここ / これから」を色分けし、
// large=true のときは各段の必要スコアと「今ココ」バッジも表示する。
function renderRankSteps(container, score, large) {
  const info = getRankInfo(score);
  container.innerHTML = "";
  RANKS.forEach((r, i) => {
    const step = document.createElement("div");
    step.className = "rank-step";
    if (i < info.index) step.classList.add("done");
    if (i === info.index) step.classList.add("current");
    if (i > info.index) step.classList.add("todo");

    const dot = document.createElement("span");
    dot.className = "rank-step-dot";
    step.appendChild(dot);

    const name = document.createElement("span");
    name.className = "rank-step-name";
    // ステップ表示では「級」を省いて短く
    name.textContent = r.name.replace("級", "");
    step.appendChild(name);

    if (large) {
      const min = document.createElement("span");
      min.className = "rank-step-min";
      min.textContent = r.min + "個〜";
      step.appendChild(min);
      if (i === info.index) {
        const here = document.createElement("span");
        here.className = "rank-here";
        here.textContent = "今ココ";
        step.appendChild(here);
      }
    }
    container.appendChild(step);
  });
}

// DOM要素の取得と、画面表示の更新をまとめる。
export function createUI() {
  const el = {
    scoreValue: document.getElementById("score-value"),
    highScoreValue: document.getElementById("highscore-value"),
    nextPreview: document.getElementById("next-preview"),
    startOverlay: document.getElementById("start-overlay"),
    gameoverOverlay: document.getElementById("gameover-overlay"),
    resultScore: document.getElementById("result-score"),
    resultHighScore: document.getElementById("result-highscore"),
    resultRank: document.getElementById("result-rank"),
    resultRankLadder: document.getElementById("result-rank-ladder"),
    rankSteps: document.getElementById("rank-steps"),
    rankProgress: document.getElementById("rank-progress"),
    startBtn: document.getElementById("start-btn"),
    restartBtn: document.getElementById("restart-btn"),
    viewBtn: document.getElementById("view-btn"),
    hint: document.getElementById("hint"),
    danger: document.getElementById("danger"),
    dangerSec: document.getElementById("danger-sec"),
  };

  return {
    el,
    setScore(v) {
      el.scoreValue.textContent = String(v);
      this.setRankProgress(v);
    },
    // HUDのランク段階＋「次まであと何個」を更新
    setRankProgress(score) {
      renderRankSteps(el.rankSteps, score, false);
      const info = getRankInfo(score);
      if (info.isMax) {
        el.rankProgress.textContent = `${info.name}（最高ランク到達！）`;
      } else {
        el.rankProgress.textContent = `${info.name}｜あと ${info.toNext} 個で ${info.next.name}`;
      }
    },
    setHighScore(v) {
      el.highScoreValue.textContent = String(v);
    },
    setNextPreview(color) {
      el.nextPreview.style.background = color;
    },
    showStart() {
      el.startOverlay.classList.remove("hidden");
    },
    hideStart() {
      el.startOverlay.classList.add("hidden");
    },
    showGameOver(score, highScore, rank) {
      el.resultScore.textContent = String(score);
      el.resultHighScore.textContent = String(highScore);
      el.resultRank.textContent = rank;
      renderRankSteps(el.resultRankLadder, score, true);
      el.gameoverOverlay.classList.remove("hidden");
    },
    hideGameOver() {
      el.gameoverOverlay.classList.add("hidden");
    },
    showHint() {
      el.hint.classList.remove("hidden");
    },
    hideHint() {
      el.hint.classList.add("hidden");
    },
    setViewLabel(mode) {
      // 現在の視点に対して「切り替え先」をラベルに出す
      el.viewBtn.textContent = mode === "side" ? "上から見る" : "横から見る";
    },
    setHintText(text) {
      el.hint.textContent = text;
    },
    showDanger(sec) {
      el.dangerSec.textContent = String(sec);
      el.danger.classList.remove("hidden");
    },
    hideDanger() {
      el.danger.classList.add("hidden");
    },
  };
}
