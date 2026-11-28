# Decisions

Verdicts Joe has given on this project. Read before changing what they cover.

## 2026-11-18 (site readiness review)

- **AI training crawlers are allowed.** robots.txt stays `User-agent: *` / `Allow: /`; no opt-out groups for GPTBot, ClaudeBot, Google-Extended, CCBot and similar.
- **/setup is not indexed.** It's the API-key page: `noindex`, and it stays out of the sitemap.
- **Keep the home hero video band** (full-width montage, scrims, side vignettes, film grain). It's the product shown as its own ident, so the gradient-scrim slop rule doesn't apply to it.

## 2026-11-18 (domain)

- **The site lives at streamroll.joekarlsson.com, hosted on Vercel.** GitHub Pages was considered and rejected: Runway's API refuses browser CORS calls, so the /api routes need a server, and Pages can't send the COOP/COEP headers ffmpeg.wasm needs. streamroll.vercel.app redirects to the custom domain.

## 2026-11-27 (credits)

- **The home page warns when the saved Runway key has 0 credits, before Generate** (.mockups/credits-warning). An amber line above Generate links to the Runway developer portal; a key whose balance can't be read shows nothing. Joe kept it: "they look good".
- **A credits error offers an "Add credits at Runway" button** in the red error box, as the main action, with Try again and Start over beside it (2026-11-27). Joe picked it over a link inside the sentence and over leaving the message as plain text. It shows only when the error is Runway's out-of-credits one, opens the developer portal in a new tab and counts as "Add Credits Click".
