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
- `app/(root)/sf6-learn/` and `components/sf6/` — `/sf6-learn/`, my Street Fighter 6 notes read live from the
  `sf6-learn` repository on my Forgejo, behind access keys. The page is static: it talks to `sf6-gateway/`, a small
  stdlib-only Python service next to Forgejo, exposed through Tailscale. Set `NEXT_PUBLIC_SF6_GATEWAY` to its URL
  (repository variable `SF6_GATEWAY_URL` for the Pages build). Setup: `sf6-gateway/README.md`.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: lint, build, publish `out/` to GitHub Pages.
