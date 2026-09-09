# アイコンの元データ

`icon.svg` / `icon-maskable.svg` は PWA アイコン（`public/*.png`）の元。ここは Vite に配信されない（`public/` の外）。

## 書き出し方（#67）

`@vite-pwa/assets-generator` は sharp 依存で脆弱性を踏むため使わない。ブラウザの canvas でラスタライズする:

```js
// dev サーバを起動し、DevTools コンソールで
async function raster(svgUrl, size) {
  const svg = await (await fetch(svgUrl)).text()
  const img = new Image()
  await new Promise((r) => { img.onload = r; img.src =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) })
  const c = Object.assign(document.createElement('canvas'), { width: size, height: size })
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fdf6e3'; ctx.fillRect(0, 0, size, size) // 不透明背景（apple-touch 必須）
  ctx.drawImage(img, 0, 0, size, size)
  return c.toDataURL('image/png')
}
```

- `pwa-192x192.png` / `pwa-512x512.png` … `icon.svg`
- `maskable-icon-512x512.png` … `icon-maskable.svg`（ロゴを中央 ~64% に収めてある）
- `apple-touch-icon-180x180.png` … `icon.svg`（不透明・角丸は焼き込まない）
