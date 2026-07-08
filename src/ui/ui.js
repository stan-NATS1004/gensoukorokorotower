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
    startBtn: document.getElementById("start-btn"),
    restartBtn: document.getElementById("restart-btn"),
    hint: document.getElementById("hint"),
  };

  return {
    el,
    setScore(v) {
      el.scoreValue.textContent = String(v);
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
  };
}
