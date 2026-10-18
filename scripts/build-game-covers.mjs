/** Original, local illustrated covers for the 20-wave games. Run: `node scripts/build-game-covers.mjs`. */
import { writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
function loadSharp() {
  const pnpm = new URL("../node_modules/.pnpm/", import.meta.url);
  const entry = readdirSync(pnpm).find((d) => d.startsWith("sharp@"));
  if (!entry) throw new Error("sharp not found in node_modules/.pnpm");
  return require(
    new URL(`../node_modules/.pnpm/${entry}/node_modules/sharp`, import.meta.url).pathname
  );
}
const sharp = loadSharp();

const covers = [
  [
    "clue-school",
    "Clue School",
    "#1c1230",
    "#6d28d9",
    "#ddd6fe",
    "EVERY CLUE HAS A TRICK.",
    "grid",
  ],
  [
    "word-square-studio",
    "Word Square Studio",
    "#0c2137",
    "#0e7490",
    "#a5f3fc",
    "ROWS AND COLUMNS AGREE.",
    "grid",
  ],
  [
    "backronym-studio",
    "Backronym Studio",
    "#2b1a0c",
    "#b45309",
    "#fde68a",
    "WORDS OUT OF THIN INITIALS.",
    "letters",
  ],
  ["twin-tilt", "Twin Tilt", "#0b1f33", "#1d4ed8", "#93c5fd", "TWO BALLS. ONE GRAVITY.", "balls"],
  ["light-loom", "Light Loom", "#12122e", "#4338ca", "#c7d2fe", "WEAVE WITH LIGHT.", "beam"],
  [
    "orbit-orchard",
    "Orbit Orchard",
    "#0d2417",
    "#15803d",
    "#bbf7d0",
    "GROW YOUR OWN GRAVITY.",
    "orbit",
  ],
  ["growbox", "Growbox", "#12240f", "#4d7c0f", "#d9f99d", "IT'S NOT WHAT - IT'S WHEN.", "plants"],
  ["ice-post", "Ice Post", "#0b2436", "#0369a1", "#bae6fd", "EVERYTHING SLIDES.", "ice"],
  [
    "stack-ledger",
    "Stack Ledger",
    "#23140c",
    "#c2410c",
    "#fed7aa",
    "BALANCE THE BOOKS AND THE TOWER.",
    "stack",
  ],
  [
    "current-courier",
    "Current Courier",
    "#082c33",
    "#0f766e",
    "#99f6e4",
    "THE RIVER HAS OPINIONS.",
    "wave",
  ],
  [
    "lava-links",
    "Lava Links",
    "#2a0e0e",
    "#b91c1c",
    "#fecaca",
    "YOUR PATH BURNS BEHIND YOU.",
    "tiles",
  ],
  [
    "gate-crash",
    "Gate Crash",
    "#101c38",
    "#1e40af",
    "#bfdbfe",
    "ONE BUTTON. CHANGING RULES.",
    "gates",
  ],
  [
    "tiny-town-tactics",
    "Tiny Town Tactics",
    "#1c1709",
    "#a16207",
    "#fde047",
    "IT'S THE JOURNEYS.",
    "town",
  ],
  [
    "lane-general",
    "Lane General",
    "#1b1030",
    "#7e22ce",
    "#e9d5ff",
    "DEPLOY. PREDICT. ADAPT.",
    "lanes",
  ],
  [
    "stockroom-six",
    "Stockroom Six",
    "#101c14",
    "#166534",
    "#bbf7d0",
    "ORDER JUST ENOUGH.",
    "boxes",
  ],
  [
    "pass-the-pencil",
    "Pass the Pencil",
    "#2c1024",
    "#be185d",
    "#fbcfe8",
    "IDEAS MUTATE.",
    "scribble",
  ],
  [
    "block-talk",
    "Block Talk",
    "#111c2e",
    "#0369a1",
    "#bae6fd",
    "SAY IT SO THEY CAN BUILD IT.",
    "blocks",
  ],
  [
    "pocket-alchemist",
    "Pocket Alchemist",
    "#251207",
    "#b45309",
    "#fdba74",
    "NOT RECIPES. PROPERTIES.",
    "flasks",
  ],
  [
    "pocket-sand",
    "Pocket Sand",
    "#241708",
    "#c2410c",
    "#fdba74",
    "TINY WORLD. TINY GOALS.",
    "grains",
  ],
  [
    "copy-machine",
    "Copy Machine",
    "#170f2c",
    "#5b21b6",
    "#ddd6fe",
    "PLAY TELEPHONE WITH YOUR HAND.",
    "scribble",
  ],
];

const rect = (x, y, w, h, fill, rx = 12, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const circle = (x, y, r, fill, extra = "") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const line = (d, color, width = 5, extra = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const text = (x, y, t, size = 18, color = "#fff", extra = "") =>
  `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" ${extra}>${t}</text>`;

function art(kind, a) {
  switch (kind) {
    case "grid":
      return `${[0, 1, 2].map((r) => [0, 1, 2].map((c) => rect(320 + c * 110, 170 + r * 90, 86, 70, r === c ? a : "#ffffff", 10, `fill-opacity="${r === c ? 0.95 : 0.12}" stroke="${a}" stroke-opacity=".5"`)).join("")).join("")}${circle(700, 175, 26, a)}${text(700, 188, "?", 34, "#101020", 'text-anchor="middle" font-weight="bold"')}`;
    case "letters":
      return `${text(300, 330, "F", 150, a, 'font-weight="bold"')}${text(420, 330, "R", 150, a, 'font-weight="bold" opacity=".75"')}${text(540, 330, "O", 150, a, 'font-weight="bold" opacity=".5"')}${text(660, 330, "G", 150, a, 'font-weight="bold" opacity=".3"')}${line("M290 380h420", a, 5)}`;
    case "balls":
      return `${rect(260, 130, 420, 300, "#0b1a2e", 24, `stroke="${a}" stroke-width="4"`)}${circle(380, 240, 34, a)}${circle(560, 320, 34, "#f8fafc")}${rect(340, 360, 80, 26, a, 8, 'opacity=".8"')}${rect(520, 160, 80, 26, "#f8fafc", 8, 'opacity=".8"')}${line("M470 100v-30m0 0-16 12m16-12 16 12", a, 4)}`;
    case "beam":
      return `${line("M180 300H420", a, 8, 'filter="url(#glow)"')}${line("M420 300 560 180", a, 8)}${line("M560 180H760", a, 8)}${circle(420, 300, 30, "#fff", 'fill-opacity=".15"')}${circle(560, 180, 30, "#fff", 'fill-opacity=".15"')}${rect(750, 155, 60, 50, a, 10)}${circle(180, 300, 14, a)}`;
    case "orbit":
      return `${circle(470, 280, 70, a, 'opacity=".9"')}${circle(470, 280, 130, "none", `stroke="${a}" stroke-opacity=".5" stroke-dasharray="8 10"`)}${circle(470, 280, 190, "none", `stroke="${a}" stroke-opacity=".3" stroke-dasharray="8 10"`)}${circle(600, 280, 16, "#f8fafc")}${circle(345, 200, 11, "#fde68a")}${circle(560, 420, 11, "#bbf7d0")}`;
    case "plants":
      return `${rect(300, 300, 360, 90, "#1a2e12", 14)}${line("M380 300V210", a, 8)}${line("M480 300V170", a, 8)}${line("M580 300V235", a, 8)}${circle(380, 195, 26, "#86efac")}${circle(480, 155, 34, "#4ade80")}${circle(580, 220, 20, "#bbf7d0")}${rect(680, 240, 90, 120, a, 12, 'opacity=".85"')}${text(725, 315, "+1", 30, "#12240f", 'text-anchor="middle" font-weight="bold"')}`;
    case "ice":
      return `${rect(240, 150, 480, 260, "#0e3a54", 22, `stroke="${a}" stroke-width="3"`)}${line("M300 220h160l60 60h140", a, 6, 'stroke-dasharray="10 8"')}${rect(600, 300, 70, 55, "#fde68a", 8)}${circle(300, 220, 18, "#f8fafc")}${line("M320 380 420 330 520 380 620 330", a, 4, 'opacity=".6"')}`;
    case "stack":
      return `${rect(360, 340, 240, 60, a, 10)}${rect(385, 275, 190, 60, a, 10, 'opacity=".85"')}${rect(410, 210, 140, 60, a, 10, 'opacity=".7"')}${rect(425, 145, 110, 60, a, 10, 'opacity=".55"')}${text(480, 378, "9", 30, "#23140c", 'text-anchor="middle" font-weight="bold"')}${text(480, 313, "7", 30, "#23140c", 'text-anchor="middle" font-weight="bold"')}${text(480, 248, "5", 30, "#23140c", 'text-anchor="middle" font-weight="bold"')}${text(480, 183, "3", 30, "#23140c", 'text-anchor="middle" font-weight="bold"')}`;
    case "wave":
      return `${line("M120 340Q240 260 360 340T600 340T840 340", a, 10)}${line("M120 260Q240 180 360 260T600 260T840 260", a, 5, 'opacity=".5"')}${rect(300, 300, 70, 40, "#f8fafc", 8)}${rect(560, 300, 70, 40, "#fde68a", 8)}${circle(335, 296, 8, "#082c33")}${circle(595, 296, 8, "#082c33")}`;
    case "tiles":
      return `${[0, 1, 2, 3, 4].map((i) => circle(300 + i * 90, 250 + (i % 2) * 80, 36, i < 3 ? "#fca5a5" : a, `stroke="#fecaca" stroke-width="3"`)).join("")}${line("M336 286 366 326 426 250 456 326 516 250", "#2a0e0e", 5)}`;
    case "gates":
      return `${rect(240, 140, 60, 280, a, 10)}${rect(420, 140, 60, 280, a, 10, 'opacity=".75"')}${rect(600, 140, 60, 280, a, 10, 'opacity=".5"')}${circle(360, 300, 22, "#f8fafc")}${line("M760 200h-40m40 0v220m0-220 40 220", a, 4)}`;
    case "town":
      return `${rect(280, 220, 110, 100, a, 8)}${rect(430, 180, 110, 140, "#f8fafc", 8, 'fill-opacity=".85"')}${rect(580, 240, 110, 80, a, 8, 'opacity=".7"')}${line("M335 220V170h-30", a, 4)}${line("M280 360Q360 330 485 350T690 340", "#23140c", 6, 'stroke-dasharray="8 8"')}${circle(335, 360, 12, "#23140c")}${circle(690, 340, 12, "#23140c")}`;
    case "lanes":
      return `${rect(260, 140, 60, 280, a, 10, 'opacity=".25"')}${rect(430, 140, 60, 280, a, 10, 'opacity=".25"')}${rect(600, 140, 60, 280, a, 10, 'opacity=".25"')}${circle(290, 220, 24, a)}${circle(460, 300, 24, "#f8fafc")}${circle(630, 190, 24, "#fde68a")}${line("M330 220h110", a, 4, 'stroke-dasharray="6 6"')}${line("M500 300h110", "#f8fafc", 4, 'stroke-dasharray="6 6"')}`;
    case "boxes":
      return `${rect(270, 300, 130, 100, a, 8)}${rect(420, 300, 130, 100, a, 8, 'opacity=".8"')}${rect(570, 300, 130, 100, a, 8, 'opacity=".6"')}${rect(345, 200, 130, 90, "#f8fafc", 8, 'fill-opacity=".9"')}${rect(505, 200, 130, 90, "#f8fafc", 8, 'fill-opacity=".7"')}${text(640, 365, "6", 44, "#101c14", 'text-anchor="middle" font-weight="bold"')}`;
    case "scribble":
      return `${line("M240 320C300 180 380 400 450 250S580 150 640 300 740 380 780 240", a, 8, 'filter="url(#glow)"')}${line("M260 360C320 240 400 430 470 300S590 220 650 340 750 400 790 300", a, 5, 'opacity=".55"')}${line("M280 395C340 300 420 455 490 355S600 290 660 380 760 420 800 350", a, 3, 'opacity=".3"')}`;
    case "blocks":
      return `${rect(300, 170, 90, 90, a, 8)}${rect(400, 170, 90, 90, a, 8, 'opacity=".8"')}${rect(300, 270, 90, 90, a, 8, 'opacity=".65"')}${rect(500, 270, 90, 90, "#f8fafc", 8, 'fill-opacity=".9"')}${rect(600, 300, 90, 90, a, 8, 'opacity=".5"')}${circle(720, 190, 40, "#fde68a")}${text(720, 205, "…", 34, "#111c2e", 'text-anchor="middle" font-weight="bold"')}`;
    case "flasks":
      return `${line("M350 140v110l-70 140a40 40 0 0 0 35 60h170a40 40 0 0 0 35-60l-70-140V140", a, 8)}${rect(320, 320, 160, 90, "#fdba74", 8, 'opacity=".8"')}${line("M560 160v90l-50 100a30 30 0 0 0 26 45h130a30 30 0 0 0 26-45l-50-100V160", "#f8fafc", 6)}${rect(545, 310, 130, 70, "#f8fafc", 8, 'opacity=".55"')}${circle(400, 280, 10, "#fde68a")}${circle(610, 300, 8, "#fdba74")}`;
    case "grains":
      return `${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => circle(280 + i * 55, 340 - (i % 3) * 40, 16 + (i % 3) * 6, a, `opacity="${0.5 + (i % 3) * 0.2}"`)).join("")}${[0, 1, 2, 3, 4].map((i) => circle(320 + i * 80, 240 - (i % 2) * 50, 10, "#fde68a", `opacity="${0.4 + (i % 2) * 0.3}"`)).join("")}${rect(240, 380, 500, 40, "#7c2d12", 10)}`;
    default:
      return circle(480, 270, 120, a, 'opacity=".85"');
  }
}

for (const [i, [id, title, bg, mid, accent, kicker, kind]] of covers.entries()) {
  const stars = Array.from({ length: 28 }, (_, n) =>
    circle(
      40 + ((n * 149) % 880),
      55 + ((n * 97) % 400),
      n % 4 === 0 ? 2 : 1,
      accent,
      `opacity="${n % 3 === 0 ? 0.5 : 0.18}"`
    )
  ).join("");
  const defs = `<defs><radialGradient id="bg"><stop stop-color="${mid}"/><stop offset="1" stop-color="${bg}"/></radialGradient><filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  const scene = `${defs}${rect(0, 0, 960, 540, "url(#bg)", 0)}${circle(480, 260, 207, "none", `stroke="${accent}" stroke-opacity=".08"`)}${circle(480, 260, 255, "none", `stroke="${accent}" stroke-opacity=".06"`)}${stars}${art(kind, accent)}`;
  const frame = `${rect(32, 28, 128, 30, "#ffffff", 15, 'fill-opacity=".08"')}${text(48, 48, `${String(19 + i).padStart(2, "0")} / PLAY LAB`, 11, accent, 'letter-spacing="2"')}${text(40, 500, kicker, 15, accent, 'font-weight="bold" letter-spacing="3"')}${line("M859 493h48m-10-9 10 9-10 9", accent, 2)}`;
  const folder = new URL(`../public/experiences/${id}/`, import.meta.url);
  mkdirSync(folder, { recursive: true });
  const cover = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540"><title>${title.replaceAll("&", "&amp;")}</title>${scene}${frame}</svg>\n`;
  writeFileSync(new URL("cover.svg", folder), cover);
  writeFileSync(
    new URL("icon.svg", folder),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="220 25 520 470"><title>${title.replaceAll("&", "&amp;")}</title>${scene}</svg>\n`
  );
  const pngBuffer = await sharp(Buffer.from(cover)).jpeg({ quality: 82 }).toBuffer();
  writeFileSync(new URL("realistic.jpg", folder), pngBuffer);
  const webp = await sharp(Buffer.from(cover)).webp({ quality: 78 }).toBuffer();
  if (webp.length >= 250_000) throw new Error(`${id} webp too large: ${webp.length}`);
  writeFileSync(new URL("realistic.webp", folder), webp);
  console.log(id, "ok", webp.length, "bytes webp");
}
console.log(`Created ${covers.length} covers.`);
if (existsSync(new URL("../content/experiences.json", import.meta.url))) {
  console.log("Registry untouched — append entries separately.");
}
