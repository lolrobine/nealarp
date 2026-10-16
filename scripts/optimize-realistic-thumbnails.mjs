/** Optimize generated masters using Next's existing image processor. No new dependency. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve("next/package.json"));
const sharp = nextRequire("sharp");
const catalogueURL = new URL("../content/experiences.json", import.meta.url);
const catalogue = JSON.parse(readFileSync(catalogueURL, "utf8"));
let count = 0;
for (const item of catalogue) {
  const folder = new URL(`../public/experiences/${item.id}/`, import.meta.url);
  const master = new URL("realistic.jpg", folder);
  if (!existsSync(master)) continue;
  const info = await sharp(master.pathname)
    .rotate()
    .resize(960, 540, { fit: "cover", position: "centre" })
    .webp({ quality: 84, effort: 6 })
    .toFile(new URL("realistic.webp", folder).pathname);
  item.thumbnail = `/experiences/${item.id}/realistic.webp`;
  count++;
  console.log(`${item.id}: 960 × 540, ${(info.size / 1024).toFixed(0)} KB`);
}
writeFileSync(catalogueURL, JSON.stringify(catalogue, null, 2) + "\n");
console.log(`Registered ${count} realistic thumbnails; other illustrations remain intact.`);
