# Jhonmedia

Jhonmedia portfolio: DTC video editing, creative strategy, and paid social work by Jhon Vin.

One-page static site. Plain HTML, CSS and JS. No build step, no frameworks, no dependencies. Design spec: `docs/DESIGN.md`.

```
index.html
assets/css/style.css
assets/js/work.js     <- the only file you edit to update the work grid
assets/js/main.js     <- interactions
assets/thumbs/        <- 01.jpg ... 09.jpg (9:16 thumbnails)
assets/img/og.jpg     <- social share image (placeholder)
assets/favicon.svg
```

## View it locally

Option 1: double-click `index.html`. It works straight from the file system.

Option 2 (closer to the real thing): run a tiny local server from the project folder.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Add thumbnails and TikTok links

Everything lives in `assets/js/work.js`. The header comment in that file walks through it. Short version:

1. **Thumbnail.** Export a 9:16 frame (1080x1920, JPG, under 250KB). Name it `01.jpg`, `02.jpg` and so on, and drop it in `assets/thumbs/`. Missing files show a gray numbered placeholder, so nothing breaks before you have them.
2. **TikTok link.** On TikTok: Share > Copy link. Paste the full link into `tiktok`, e.g. `https://www.tiktok.com/@jhonmedia/video/7351234567890123456`. Links still containing `/video/0000...` are treated as "not set yet": the card opens your profile and the cursor says `SOON`.
3. **Details.** `title`, `brand`, `category` (one of `UGC`, `Product Demo`, `Talking Head`, `Motion`; this drives the filters and counts), `format` (e.g. `0:24 · 9:16`) and `metric` (e.g. `2.4x ROAS`, or `""` to hide it).
4. **Order.** The grid follows the array order. Best first.
5. **Click behavior.** `WORK_CONFIG.mode = "newtab"` (default) opens TikTok in a new tab. `"lightbox"` plays the TikTok embed on the page (needs full `/video/123...` links, not `vm.tiktok.com` short links).

Other placeholders (stats, testimonials, prices, brand names, booking link, social URLs, timezone) are marked with `placeholder — replace` HTML comments in `index.html`. The clock timezone is `CONFIG.timeZone` at the top of `assets/js/main.js`.

## Deploy

The site is just static files, so any static host works. Upload the whole folder (keep the structure).

- **Netlify:** go to https://app.netlify.com/drop and drag the project folder onto the page. Done. Connect the GitHub repo later if you want auto-deploys.
- **Vercel:** `vercel.com/new` > import the GitHub repo, framework preset "Other", no build command, output directory `.`. Or run `npx vercel` in the folder.
- **GitHub Pages:** push to GitHub, then repo Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`. The site appears at `https://<user>.github.io/<repo>/`.

After deploying, swap `assets/img/og.jpg` for a real 1200x630 image and change the `og:image` meta tag in `index.html` to its absolute URL.
