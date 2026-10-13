import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export for GitHub Pages: `next build` writes the site to `out/`.
  output: "export",
  // Emit `/fr/index.html` so GitHub Pages serves `/fr/` without a rewrite.
  trailingSlash: true,
  experimental: {
    // One 404 page for both locales: the root layout lives under `app/[lang]`.
    globalNotFound: true,
  },
};

export default nextConfig;
