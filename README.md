# 幻想ころころタワー

東方Projectを題材にした二次創作ファンゲーム（個人制作）の3D積み上げゲームです。
上から落ちてくるキャラ玉を左右に動かし、崩さずにどこまで高く積めるかを競います。

> このゲームは東方Projectを題材にした二次創作ファンゲームです。
> 東方Projectおよび各キャラクターの権利は上海アリス幻樂団様に帰属します。
> 公式作品ではありません。
> ゲーム内の画像・音声・素材は自作または使用許可のある素材のみを使用しています。

## 技術構成

- [Vite](https://vitejs.dev/) — 開発サーバー・ビルド
- [Three.js](https://threejs.org/) — 3D描画
- [cannon-es](https://github.com/pmndrs/cannon-es) — 物理演算
- JavaScript（1ページ完結・iframe埋め込み前提）

## セットアップ

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # dist/ に本番ビルド
npm run preview  # ビルド結果をローカル確認
```

## 遊び方

- ◀ ▶ ボタン（またはキーボードの左右矢印キー）で落とす位置を移動
- 「おとす」ボタン（またはスペースキー）で球を落とす
- 崩さずに積み上げるとスコアが増える
- ゲームオーバーライン（赤い線）を球が2秒以上超えるとゲームオーバー
- Rキー、または「もう一度あそぶ」でリスタート

## フォルダ構成

```txt
genso-korokoro-tower
  public/images/characters   キャラ顔画像を置く場所（後から差し替え可）
  src
    main.js                  ゲーム全体の制御
    game/
      config.js              寸法・物理値・ランクなどの設定
      scene.js               Three.js シーン/カメラ/床/壁
      physics.js             cannon-es 物理世界
      ball.js                キャラ玉の見た目（球＋顔ビルボード）
    data/characters.js       キャラデータ
    ui/ui.js                 DOM表示の更新
    style.css                スタイル
  index.html
```

## キャラ画像の差し替え

1. `public/images/characters/` に正方形（透過PNG推奨）の顔画像を置く
2. `src/data/characters.js` の該当キャラの `texture` にファイル名を設定する
3. 画像がない場合は自動生成のかわいい顔付き色玉で代用されます

原作ゲームから抜き出した画像・音声は使用しないでください。

## WordPress埋め込み

`npm run build` でできた `dist/` を Vercel / Cloudflare Pages などに公開し、
固定ページのカスタムHTMLブロックに以下を貼り付けます。

```html
<div style="max-width:430px;margin:0 auto;">
  <iframe
    src="https://公開したゲームのURL"
    style="width:100%;aspect-ratio:9/16;border:0;border-radius:16px;overflow:hidden;"
    loading="lazy"
    allowfullscreen>
  </iframe>
</div>
```
