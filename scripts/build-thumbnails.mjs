/** Original, local SVG illustrations. Run with `node scripts/build-thumbnails.mjs`. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
const catalogue = JSON.parse(readFileSync(new URL("../content/experiences.json", import.meta.url)));
const themes = {
  "spend-money": ["#042f2e", "#115e59", "#5eead4", "DREAM BIG. SPEND BIGGER."],
  "password-game": ["#261333", "#701a75", "#f0abfc", "ONE MORE RULE."],
  "deep-sea": ["#020b25", "#075985", "#67e8f9", "INTO THE UNKNOWN."],
  speed: ["#1d1437", "#6d28d9", "#c4b5fd", "BLINK AND YOU MISS IT."],
  "life-stats": ["#082f49", "#0e7490", "#a5f3fc", "A LIFE, IN NUMBERS."],
  "perfect-circle": ["#172554", "#3730a3", "#a5b4fc", "CHASE THE IMPOSSIBLE."],
  "size-of-space": ["#100c2e", "#312e81", "#c4b5fd", "KEEP ZOOMING OUT."],
  "asteroid-launcher": ["#2b1220", "#9a3412", "#fdba74", "MAKE AN IMPACT."],
  "one-second-off": ["#082f49", "#1d4ed8", "#7dd3fc", "TRUST YOUR INNER CLOCK."],
  "trust-your-eyes": ["#251135", "#6d28d9", "#d8b4fe", "LOOK CLOSER."],
  "color-memory": ["#341127", "#9d174d", "#fda4af", "LOOK. REMEMBER. RECREATE."],
  "which-is-more": ["#082f34", "#0f766e", "#99f6e4", "PICK A SIDE."],
  "form-game": ["#2c1c15", "#92400e", "#fde68a", "APPROVAL IS A JOURNEY."],
  "pack-it-perfectly": ["#052e26", "#047857", "#6ee7b7", "EVERY PIECE BELONGS."],
  "gravity-golf": ["#0f1239", "#3730a3", "#a5b4fc", "A LITTLE COSMIC CURVE."],
  "how-deep-can-you-dig": ["#29180e", "#9a3412", "#fdba74", "WHAT LIES BENEATH?"],
  "tiny-ecosystem": ["#092b25", "#166534", "#bef264", "SMALL WORLD. BIG BALANCE."],
  "one-small-change": ["#1f1539", "#6d28d9", "#c4b5fd", "CHANGE THE RULES."],
  "clue-school": ["#1c1230", "#6d28d9", "#ddd6fe", "EVERY CLUE HAS A TRICK."],
  "word-square-studio": ["#0c2137", "#0e7490", "#a5f3fc", "ROWS AND COLUMNS AGREE."],
  "backronym-studio": ["#2b1a0c", "#b45309", "#fde68a", "WORDS OUT OF THIN INITIALS."],
  "twin-tilt": ["#0b1f33", "#1d4ed8", "#93c5fd", "TWO BALLS. ONE GRAVITY."],
  "light-loom": ["#12122e", "#4338ca", "#c7d2fe", "WEAVE WITH LIGHT."],
  "orbit-orchard": ["#0d2417", "#15803d", "#bbf7d0", "GROW YOUR OWN GRAVITY."],
  growbox: ["#12240f", "#4d7c0f", "#d9f99d", "IT'S NOT WHAT - IT'S WHEN."],
  "ice-post": ["#0b2436", "#0369a1", "#bae6fd", "EVERYTHING SLIDES."],
  "stack-ledger": ["#23140c", "#c2410c", "#fed7aa", "BALANCE THE BOOKS AND THE TOWER."],
  "current-courier": ["#082c33", "#0f766e", "#99f6e4", "THE RIVER HAS OPINIONS."],
  "lava-links": ["#2a0e0e", "#b91c1c", "#fecaca", "YOUR PATH BURNS BEHIND YOU."],
  "gate-crash": ["#101c38", "#1e40af", "#bfdbfe", "ONE BUTTON. CHANGING RULES."],
  "tiny-town-tactics": ["#1c1709", "#a16207", "#fde047", "IT'S THE JOURNEYS."],
  "lane-general": ["#1b1030", "#7e22ce", "#e9d5ff", "DEPLOY. PREDICT. ADAPT."],
  "stockroom-six": ["#101c14", "#166534", "#bbf7d0", "ORDER JUST ENOUGH."],
  "pass-the-pencil": ["#2c1024", "#be185d", "#fbcfe8", "IDEAS MUTATE."],
  "block-talk": ["#111c2e", "#0369a1", "#bae6fd", "SAY IT SO THEY CAN BUILD IT."],
  "pocket-alchemist": ["#251207", "#b45309", "#fdba74", "NOT RECIPES. PROPERTIES."],
  "pocket-sand": ["#241708", "#c2410c", "#fdba74", "TINY WORLD. TINY GOALS."],
  "copy-machine": ["#170f2c", "#5b21b6", "#ddd6fe", "PLAY TELEPHONE WITH YOUR HAND."],
};
const rect = (x, y, w, h, fill, rx = 12, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const circle = (x, y, r, fill, extra = "") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const line = (d, color, width = 5, extra = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const text = (x, y, t, size = 18, color = "#fff", extra = "") =>
  `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}" ${extra}>${t}</text>`;
function art(id, a) {
  const white = "#edfaff",
    dark = "#132238";
  switch (id) {
    case "spend-money":
      return `<g transform="rotate(-12 470 260)" filter="url(#shadow)">${[0, 1, 2].map((i) => rect(265 + i * 22, 155 + i * 36, 360, 160, i === 2 ? "#5eead4" : "#0f766e", 18)).join("")}${rect(327, 246, 280, 112, "none", 10, 'stroke="#0f766e" stroke-width="3"')}${circle(466, 301, 43, "#0f766e")}${text(466, 322, "$", 64, white, 'text-anchor="middle"')}${text(345, 278, "100", 22, dark)}${text(548, 339, "100", 22, dark)}</g>${[0, 1, 2].map((i) => `<g transform="translate(${670 + i * 11} ${260 - i * 25})">${circle(0, 0, 35, "#fbbf24", 'stroke="#fde68a" stroke-width="5"')}${text(0, 12, "$", 35, "#92400e", 'text-anchor="middle"')}</g>`).join("")}`;
    case "password-game":
      return `<g filter="url(#shadow)">${rect(275, 146, 410, 210, "#19152f", 24, 'stroke="#c084fc" stroke-width="2"')}${circle(307, 174, 5, "#fb7185")}${circle(326, 174, 5, "#fbbf24")}${circle(345, 174, 5, "#4ade80")}${rect(308, 216, 344, 62, "#36204b", 10)}${[0, 1, 2, 3, 4, 5].map((i) => circle(335 + i * 40, 247, 7, a)).join("")}${line("M588 232V262", a, 3)}${line("M312 314l10 10 21-24", "#86efac", 5)}${line("M367 314h180", "#8b719e", 7)}</g>${circle(688, 158, 37, "#fbbf24")}${text(688, 173, "!", 46, "#482b11", 'text-anchor="middle" font-weight="bold"')}`;
    case "deep-sea":
      return `<path d="M0 160Q240 120 480 160T960 160V540H0Z" fill="#083d67" opacity=".45"/><path d="M0 350Q240 300 480 350T960 350V540H0Z" fill="#031c38"/>${line("M330 172Q460 115 600 218Q680 270 604 320Q477 381 350 293L279 330L298 262L270 205Z", "#67e8f9", 4)}<path d="M330 172Q460 115 600 218Q680 270 604 320Q477 381 350 293L279 330L298 262L270 205Z" fill="#0e7490"/>${circle(575, 238, 9, white)}${circle(577, 237, 4, dark)}${line("M549 199Q574 110 624 145", a, 3)}${circle(627, 145, 12, white, 'filter="url(#glow)"')}${[0, 1, 2, 3, 4, 5].map((i) => circle(210 + i * 103, 115 + ((i * 67) % 230), 3, a, 'opacity=".5"')).join("")}`;
    case "speed":
      return `${[0, 1, 2, 3].map((i) => line(`M${90 + i * 35} ${175 + i * 52}H${340 + i * 10}`, a, 4, 'opacity=".35"')).join("")}<g transform="rotate(-13 515 270)" filter="url(#shadow)">${line("M340 300h315", a, 8)}<path d="M350 285l62-75h137l70 75Z" fill="#c4b5fd"/><path d="M423 222h110l47 55H386Z" fill="#312e81"/>${rect(320, 279, 365, 63, "#8b5cf6", 18)}${circle(397, 339, 32, dark, 'stroke="#e0e7ff" stroke-width="9"')}${circle(609, 339, 32, dark, 'stroke="#e0e7ff" stroke-width="9"')}${line("M357 298h40", white, 8)}</g>`;
    case "life-stats":
      return `${rect(282, 120, 390, 275, "#e0f2fe", 25, 'filter="url(#shadow)"')}${rect(282, 120, 390, 65, "#0891b2", 25)}${[342, 612].map((x) => line(`M${x} 105V146`, a, 14)).join("")}${[0, 1, 2, 3, 4, 5].map((i) => rect(318 + (i % 3) * 73, 210 + Math.floor(i / 3) * 54, 43, 27, "#a5d8e6", 7)).join("")}${line("M333 335h48l22-35 24 61 25-37h48", "#0891b2", 6)}${circle(636, 334, 73, "#164e63", 'stroke="#67e8f9" stroke-width="3"')}${text(636, 350, "24/7", 30, white, 'text-anchor="middle" font-weight="bold"')}`;
    case "perfect-circle":
      return `${circle(480, 258, 128, "none", 'stroke="#8291ff" stroke-width="2" stroke-dasharray="6 8" opacity=".6"')}${line("M603 237C590 129 425 92 365 201C294 338 475 424 574 342C628 297 617 243 603 237", a, 12, 'filter="url(#glow)"')}${circle(480, 258, 4, white)}${line("M645 185l-31 51 15 7 31-51Z", white, 6)}${text(480, 274, "99.8%", 48, white, 'text-anchor="middle" font-weight="bold"')}`;
    case "size-of-space":
      return `${[210, 140, 75].map((r) => `<ellipse cx="480" cy="260" rx="${r * 1.5}" ry="${r * 0.62}" transform="rotate(-22 480 260)" fill="none" stroke="${a}" stroke-width="2" opacity=".35"/>`).join("")}${circle(480, 260, 80, "url(#planet)", 'filter="url(#shadow)"')}${circle(279, 278, 19, "#67e8f9")}${circle(691, 140, 8, white, 'filter="url(#glow)"')}${circle(385, 220, 6, white)}${line("M706 285v60m-30-30h60", a, 3)}`;
    case "asteroid-launcher":
      return `<path d="M200 540A300 260 0 0 1 800 540Z" fill="#0c4a6e"/><path d="M240 540Q320 406 412 455T680 490" fill="none" stroke="#22d3ee" stroke-width="34" opacity=".25"/><path d="M375 75L635 325L571 371Z" fill="url(#flame)"/>${line("M432 94L645 300", "#fdba74", 9)}${circle(600, 327, 47, "#7c2d12", 'stroke="#fb923c" stroke-width="8" filter="url(#glow)"')}${circle(587, 314, 12, "#431407")}${circle(617, 339, 9, "#431407")}${[0, 1, 2].map((i) => `<ellipse cx="615" cy="451" rx="${40 + i * 35}" ry="${12 + i * 9}" fill="none" stroke="${a}" opacity="${0.8 - i * 0.2}" stroke-width="3"/>`).join("")}`;
    case "one-second-off":
      return `${circle(480, 270, 144, "#0c234b", 'stroke="#60a5fa" stroke-width="3" filter="url(#shadow)"')}${circle(480, 270, 124, "none", 'stroke="#2d5081" stroke-width="8"')}${line("M480 146A124 124 0 1 1 363 311", a, 10, 'filter="url(#glow)"')}${rect(447, 80, 66, 24, a, 8)}${line("M480 108v19", a, 10)}${line("M584 142l19-20", a, 14)}${text(480, 287, "?.???", 59, white, 'text-anchor="middle"')}${text(480, 332, "FEEL THE TIME", 13, a, 'text-anchor="middle" letter-spacing="4"')}`;
    case "trust-your-eyes":
      return `<path d="M245 270Q480 44 715 270Q480 496 245 270Z" fill="#a78bfa"/><path d="M272 270Q480 89 688 270Q480 451 272 270Z" fill="#ede9fe"/>${circle(480, 270, 89, "#7c3aed")}${circle(480, 270, 42, "#251345")}${circle(500, 244, 16, white)}${line("M480 140V176M480 364V400M350 270H387M574 270H610", a, 3)}${line("M740 205v130M725 205h30M725 335h30", a, 3)}`;
    case "color-memory":
      return `${[-22, 0, 22].map((angle, i) => `<g transform="rotate(${angle} 480 310)" filter="url(#shadow)">${rect(375, 105, 210, 290, ["#fb7185", "#fbbf24", "#a78bfa"][i], 20)}${rect(393, 125, 174, 195, ["#fda4af", "#fde68a", "#c4b5fd"][i], 10)}${circle(480, 355, 10, "#fff", 'opacity=".65"')}</g>`).join("")}${circle(687, 183, 26, "#2dd4bf")}${circle(255, 338, 18, "#60a5fa")}`;
    case "which-is-more":
      return `${line("M480 175v185M375 365h210M332 198h296", a, 10)}${circle(480, 197, 14, white)}${line("M340 200L280 285h120Z", a, 4)}${line("M620 200L560 285h120Z", a, 4)}<path d="M270 285Q340 350 410 285Z" fill="#2dd4bf"/><path d="M550 285Q620 350 690 285Z" fill="#60a5fa"/>${circle(340, 242, 27, "#99f6e4")}${rect(597, 218, 45, 45, "#bfdbfe", 7)}${text(480, 153, "?", 60, white, 'text-anchor="middle" font-weight="bold"')}`;
    case "form-game":
      return `<g transform="rotate(-8 470 270)" filter="url(#shadow)">${rect(325, 100, 295, 315, "#fffbeb", 14)}${rect(395, 90, 150, 32, "#92400e", 9)}${[0, 1, 2, 3].map((i) => `${rect(352, 155 + i * 53, 23, 23, "none", 3, 'stroke="#b45309" stroke-width="2"')}${line(`M393 ${168 + i * 53}h${i === 3 ? 110 : 180}`, "#c4b6a0", 7)}`).join("")}${line("M356 215l7 7 15-20", "#15803d", 4)}</g><g transform="rotate(12 598 311)">${rect(505, 278, 192, 70, "none", 8, 'stroke="#f87171" stroke-width="5"')}${text(601, 322, "APPROVED", 24, "#f87171", 'text-anchor="middle" font-weight="bold"')}</g>`;
    case "pack-it-perfectly":
      return `${line("M418 132v-22h124v22", a, 12)}${rect(280, 140, 400, 266, "#064e3b", 28, 'stroke="#6ee7b7" stroke-width="9" filter="url(#shadow)"')}${rect(307, 167, 160, 99, "#34d399", 11)}${rect(480, 167, 172, 99, "#a3e635", 11)}${rect(307, 279, 101, 99, "#2dd4bf", 11)}${rect(421, 279, 231, 99, "#60a5fa", 11)}${line("M335 194h105M505 193h117M449 306h170", "#fff", 4, 'opacity=".35"')}${rect(690, 188, 61, 61, "#fde68a", 10, 'transform="rotate(16 720 218)"')}${line("M725 273q-15 50-46 61", a, 3, 'stroke-dasharray="5 7"')}`;
    case "gravity-golf":
      return `${circle(470, 276, 78, "url(#planet)", 'filter="url(#shadow)"')}<ellipse cx="470" cy="276" rx="116" ry="30" transform="rotate(-25 470 276)" fill="none" stroke="#818cf8" stroke-width="9"/>${line("M230 346C350 32 625 67 715 214", a, 4, 'stroke-dasharray="7 11"')}${circle(230, 346, 10, white)}${circle(604, 111, 12, white, 'filter="url(#glow)"')}${circle(715, 214, 32, "none", 'stroke="#86efac" stroke-width="4" stroke-dasharray="6 5"')}${line("M715 185v-65l39 17-39 15", "#86efac", 4)}`;
    case "how-deep-can-you-dig":
      return `${[0, 1, 2, 3, 4].map((i) => `<path d="M180 ${155 + i * 49}Q320 ${120 + i * 49} 480 ${155 + i * 49}T780 ${155 + i * 49}V${210 + i * 49}H180Z" fill="${["#15803d", "#854d0e", "#b45309", "#c2410c", "#f97316"][i]}"/>`).join("")}${rect(447, 126, 66, 225, "#292524", 6)}${line("M480 111V300", a, 14)}${[0, 1, 2, 3, 4].map((i) => line(`M454 ${172 + i * 30}l52 20`, "#fef3c7", 6)).join("")}<path d="M452 327h56l-28 39Z" fill="#fde68a"/>${[0, 1, 2, 3].map((i) => circle(413 + i * 45, 380 + (i % 2) * 15, 5, "#fed7aa")).join("")}`;
    case "tiny-ecosystem":
      return `<path d="M303 108h354v166a177 137 0 0 1-354 0Z" fill="#bef264" opacity=".12" stroke="#bef264" stroke-width="4"/>${rect(407, 88, 146, 32, "#0f5144", 12, 'stroke="#6ee7b7" stroke-width="3"')}<path d="M307 295Q480 215 653 295A177 115 0 0 1 307 295Z" fill="#166534"/><path d="M320 300Q480 250 640 300A165 95 0 0 1 320 300Z" fill="#4d7c0f"/>${line("M477 327V205", "#a3e635", 8)}<path d="M478 254Q394 257 407 187Q482 179 478 254Z" fill="#4ade80"/><path d="M479 227Q483 150 552 165Q564 224 479 227Z" fill="#bef264"/>${circle(389, 317, 20, "#fef3c7")}${line("M378 300v-20m19 20v-20", "#fef3c7", 7)}${circle(573, 319, 22, "#fb923c")}${circle(581, 314, 3, dark)}${circle(570, 312, 3, dark)}`;
    case "one-small-change":
      return `${line("M250 350H730", "#a78bfa", 4)}${line("M310 150Q360 350 405 350Q460 40 515 350Q560 170 605 350Q637 245 669 350", a, 4, 'stroke-dasharray="7 7"')}${circle(466, 178, 26, "#c4b5fd", 'filter="url(#shadow)"')}${circle(465, 175, 10, white, 'opacity=".45"')}${line("M326 398h308", "#5b458a", 10)}${circle(530, 398, 13, white)}${text(326, 439, "LESS BOUNCE", 12, a, 'letter-spacing="2"')}${text(634, 439, "MORE", 12, a, 'text-anchor="end" letter-spacing="2"')}`;
    default:
      return `${circle(480, 265, 120, a, 'opacity=".9"')}${circle(480, 265, 165, "none", `stroke="${a}" stroke-opacity=".5" stroke-dasharray="9 11"`)}${rect(395, 195, 170, 140, "none", 16, `stroke="${white}" stroke-width="4"`)}${text(480, 285, "PLAY", 36, white, 'text-anchor="middle" font-weight="bold"')}`;
  }
}
for (const [i, item] of catalogue.entries()) {
  const [bg, mid, accent, kicker] = themes[item.id];
  const stars = Array.from({ length: 32 }, (_, n) =>
    circle(
      40 + ((n * 137) % 880),
      60 + ((n * 89) % 390),
      n % 4 === 0 ? 2 : 1,
      accent,
      `opacity="${n % 3 === 0 ? 0.5 : 0.18}"`
    )
  ).join("");
  const defs = `<defs><radialGradient id="bg"><stop stop-color="${mid}"/><stop offset="1" stop-color="${bg}"/></radialGradient><linearGradient id="planet" x2=".9" y2="1"><stop stop-color="#c4b5fd"/><stop offset=".4" stop-color="#6366f1"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient><linearGradient id="flame" x2=".8" y2="1"><stop stop-color="#fdba74" stop-opacity="0"/><stop offset="1" stop-color="#f97316"/></linearGradient><filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".35"/></filter><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  const scene = `${defs}${rect(0, 0, 960, 540, "url(#bg)", 0)}${circle(480, 260, 207, "none", `stroke="${accent}" stroke-opacity=".08"`)}${circle(480, 260, 255, "none", `stroke="${accent}" stroke-opacity=".06"`)}${stars}${art(item.id, accent)}`;
  const frame = `${rect(32, 28, 128, 30, "#ffffff", 15, 'fill-opacity=".08"')}${text(48, 48, `${String(i + 1).padStart(2, "0")} / PLAY LAB`, 11, accent, 'letter-spacing="2"')}${text(40, 500, kicker, 15, accent, 'font-weight="bold" letter-spacing="3"')}${line("M859 493h48m-10-9 10 9-10 9", accent, 2)}`;
  const folder = new URL(`../public/experiences/${item.id}/`, import.meta.url);
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    new URL("cover.svg", folder),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540"><title>${item.title.replaceAll("&", "&amp;")}</title>${scene}${frame}</svg>\n`
  );
  writeFileSync(
    new URL("icon.svg", folder),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="220 25 520 470">${scene}</svg>\n`
  );
  item.icon = `/experiences/${item.id}/icon.svg`;
  // Regenerating vector fallbacks must never replace a generated photographic cover.
  item.thumbnail = existsSync(new URL("realistic.webp", folder))
    ? `/experiences/${item.id}/realistic.webp`
    : `/experiences/${item.id}/cover.svg`;
}
writeFileSync(
  new URL("../content/experiences.json", import.meta.url),
  JSON.stringify(catalogue, null, 2) + "\n"
);
console.log(`Created ${catalogue.length} unique illustrated covers.`);
