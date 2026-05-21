import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const build = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

if ((build.status ?? 1) !== 0) {
  process.exit(build.status ?? 1);
}

const outDir = resolve("dist");
const baseUrl = resolvePublicUrl(process.env.VITE_QUALITY_LIFE_PUBLIC_URL ?? process.env.QUALITY_LIFE_PUBLIC_URL ?? "");

mkdirSync(outDir, { recursive: true });
writeFileSync(
  resolve(outDir, "robots.txt"),
  [
    "User-agent: *",
    "Allow: /",
    baseUrl ? `Sitemap: ${baseUrl.replace(/\/$/, "")}/sitemap.xml` : "# Set QUALITY_LIFE_PUBLIC_URL to emit an absolute sitemap URL."
  ].join("\n") + "\n"
);

writeFileSync(
  resolve(outDir, "site.webmanifest"),
  JSON.stringify(
    {
      name: "Quality life",
      short_name: "Quality life",
      description: "A calm, private utility app for tiny annoying moments.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#101217",
      theme_color: "#101217",
      icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
    },
    null,
    2
  ) + "\n"
);

if (baseUrl) {
  writeFileSync(
    resolve(outDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url><loc>${baseUrl.replace(/\/$/, "")}/</loc></url>\n` +
      `</urlset>\n`
  );
  console.log(`Generated sitemap for ${baseUrl}`);
} else {
  console.log("Skipped sitemap generation. Set QUALITY_LIFE_PUBLIC_URL to emit an absolute sitemap URL.");
}

function resolvePublicUrl(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return "";
  return trimmed;
}
