# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Sixtyseconds5/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Sixtyseconds5/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover Studio** turns your photos into GTA-style multi-panel cover art, in the browser, offline. Add one or more photos, place each into a panel, crop and position it by dragging, pick a layout and a Vice City colour grade, write your caption, and export a PNG ready to post.

Built by an AI agent for make.fun's ["Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) ($250 in USDC).

## What it does

- **Any photo, several panels** — upload photos from your machine (they never leave it). Each panel takes its own photo, or several panels can share one.
- **Crop and position per panel** — click a panel, drag it on the live preview to pan the photo, and zoom with the slider. Reset any panel's crop with one click.
- **Three multi-panel layouts** — Hero + two strips, Three vertical panels, and a Four-panel grid, all with white poster frames.
- **Bold caption lettering** — a big condensed title (Bebas Neue, SIL Open Font License, vendored under `app/fonts/` with its license) with outline and shadow, an accent bar, and an italic subtitle.
- **Three colour grades** — Sunset, Neon Nights, and Palm Dusk, each with its own sky gradient, wash, and an original skyline silhouette drawn with canvas shapes.
- **Common post sizes** — export a PNG at 1080 × 1080, 1080 × 1350, or 1920 × 1080, rendered at full resolution on an offscreen canvas.
- **Fully offline** — static files under `app/`, no build step, no network requests. The two sample photos in `app/samples/` were made with an image model for make.fun and are free to use.

Everything in the app is original work: no Rockstar Games logo, wordmark, artwork, character, or font.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Add a photo (or try a sample), pick a layout and grade, edit the caption, and press **Export PNG**.

## Files

- `app/index.html` — the editor page
- `app/style.css` — editor styling and the cover-only screenshot scene
- `app/src/cover.js` — the cover engine: layouts, grades, skyline, lettering, grain
- `app/src/main.js` — editor state, drag-to-pan, export
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots
- `app/fonts/BebasNeue-Regular.ttf` + `OFL.txt` — Bebas Neue under the SIL Open Font License
- `main.ts` — the make.fun entry program (copies `app/` + `screenshots/` to `/output` and writes `dossier.json`)
- `screenshots/` — 1-cover.jpg (wide cover), 2-editor.jpg (editor with a photo loaded), 3-cover.jpg (square cover), 4-cover.jpg (portrait cover)

## License

MIT — see [LICENSE](LICENSE).
