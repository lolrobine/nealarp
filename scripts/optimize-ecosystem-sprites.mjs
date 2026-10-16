import { createRequire } from "node:module";
const sharp = createRequire(import.meta.resolve("next/package.json"))("sharp");
// Flood only edge-connected matte: white for the rabbit, neutral checkerboard for the fox.
// Interior fur islands are preserved; the app serves the transparent WebP outputs.
for (const animal of ["rabbit", "fox"]) {
  const source = `public/experiences/tiny-ecosystem/${animal}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info,
    seen = new Uint8Array(w * h),
    queue = new Int32Array(w * h);
  let head = 0,
    tail = 0;
  function visit(i) {
    if (i < 0 || i >= w * h || seen[i]) return;
    const p = i * 4;
    const min = Math.min(data[p], data[p + 1], data[p + 2]),
      max = Math.max(data[p], data[p + 1], data[p + 2]);
    const background = animal === "fox" ? max - min < 14 : min >= 237;
    if (!background) return;
    seen[i] = 1;
    queue[tail++] = i;
  }
  for (let x = 0; x < w; x++) {
    visit(x);
    visit((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    visit(y * w);
    visit(y * w + w - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    data[i * 4 + 3] = 0;
    if (i % w) visit(i - 1);
    if (i % w < w - 1) visit(i + 1);
    visit(i - w);
    visit(i + w);
  }
  await sharp(data, { raw: info })
    .trim()
    .resize({ width: 320, height: 220, fit: "inside" })
    .webp({ quality: 88 })
    .toFile(`public/experiences/tiny-ecosystem/${animal}.webp`);
  console.log(`${animal}: transparent optimized sprite`);
}
