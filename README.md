# leoazzopardi.org

Portfolio of Léo Azzopardi, in French and English. Next.js 16, exported as static HTML and served by GitHub Pages.

## Develop

```bash
npm ci
npm run dev      # http://localhost:3000/fr/
npm run lint
npm run build    # static site in out/
```

## Structure

- `app/[lang]/` — the site, one static page per locale (`/fr/`, `/en/`).
  - `dictionaries/fr.ts`, `dictionaries/en.ts` — all copy. `**bold**` and `*italic*` are rendered.
- `app/(root)/` — `/` forwards to `/fr/` or `/en/` from the browser language.
- `app/global-not-found.tsx` — the 404 page (`out/404.html`).
- `components/hero/scene.js` — the hero canvas: the shaft, the moss, the cats, the manta rays.
- `content/` — validated drafts, the hero prototype, and `tools/roto.py` (traces run-cycle silhouettes from a GIF).
- `public/CNAME` — custom domain for GitHub Pages.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: lint, build, publish `out/` to GitHub Pages.
