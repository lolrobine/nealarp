import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Touch and keyboard parity is a rule here, and the way it breaks is always the same: a plain
 * div or svg picks up an onClick, looks perfectly clickable, and is unreachable for anyone not
 * holding a pointer. Asteroid Launcher shipped that way - both of its maps put the launch
 * surface in a bare div that was additionally aria-hidden, so the only verb the game has could
 * not be performed with a keyboard at all.
 *
 * A non-interactive element that takes a pointer event has to earn it: a key handler and a
 * tab stop, or a documented equivalent route listed below with the reason.
 */
describe("every pointer target has a keyboard route", () => {
  const ROOTS = [join(process.cwd(), "app/(experiences)"), join(process.cwd(), "lib/components")];

  /** Elements that are operable by keyboard on their own. */
  const INTERACTIVE = new Set([
    "button",
    "a",
    "input",
    "select",
    "textarea",
    "label",
    "summary",
    "Button",
    "Slider",
    "ChoiceStrip",
  ]);

  const POINTER = /\bon(?:Click|PointerDown|MouseDown|TouchStart)=/;
  const KEY_HANDLER = /\bonKey(?:Down|Up|Press)=/;
  const TAB_STOP = /\btabIndex=/;

  /** Each entry needs a reason, checked by hand, not a shrug. */
  const EQUIVALENT_ROUTE_EXISTS: Record<string, string> = {
    "asteroid-launcher/WorldMap.tsx":
      "impact markers select on click; the same selection sits in the named checkbox list below the map",
    "asteroid-launcher/CountryMap.tsx": "same marker list as the world map",
    "current-courier/page.tsx":
      "the container only draws drags; every cell is a real button that reads detail === 0 for Enter",
    "gravity-golf/page.tsx": "the page states the sliders offer the same controls without dragging",
    "trust-your-eyes/page.tsx": "the page states the sliders and arrow keys do the same job",
    "deep-sea/page.tsx":
      "the backdrop closes a dialog that also has a named Close button, and the creature wrapper keys off the focusable card inside it",
    "speed/page.tsx": "the card is a convenience target; the item name inside it is a real button",
    "size-of-space/page.tsx":
      "clicking the scale strip sets the zoom centre, which the labelled position slider sets too",
  };

  /**
   * Debt, recorded rather than disguised. These three are freehand drawing surfaces: the whole
   * input is the shape of a stroke, and nobody has designed a keyboard equivalent for them yet.
   * Listing them keeps the check useful - a new pointer-only element still fails - while being
   * honest that the catalogue is not fully keyboard-playable today. Fix one and delete its line.
   */
  const POINTER_ONLY_TODO = [
    "copy-machine/page.tsx: <canvas> takes a pointer event with no keyboard route",
    "pass-the-pencil/page.tsx: <canvas> takes a pointer event with no keyboard route",
    "perfect-circle/page.tsx: <canvas> takes a pointer event with no keyboard route",
  ];

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      if (!entry.name.endsWith(".tsx") || entry.name.includes(".test.")) return [];
      return [path];
    });
  }

  /**
   * Read a JSX opening tag from "<" to the ">" that closes it. Brace depth has to be tracked:
   * attributes hold arrow functions, and a naive scan stops dead on the ">" of "=>", which is
   * how an earlier version of this scan reported handlers that were plainly there.
   */
  function openingTags(source: string): { name: string; attrs: string }[] {
    const tags: { name: string; attrs: string }[] = [];
    for (let i = 0; i < source.length; i += 1) {
      if (source[i] !== "<") continue;
      const name = /^<([A-Za-z][\w.]*)/.exec(source.slice(i, i + 48));
      if (!name) continue;
      let depth = 0;
      let j = i + name[0].length;
      for (; j < source.length; j += 1) {
        const ch = source[j];
        if (ch === "{") depth += 1;
        else if (ch === "}") depth -= 1;
        else if (ch === ">" && depth === 0) break;
      }
      tags.push({ name: name[1]!, attrs: source.slice(i + name[0].length, j) });
      i = j;
    }
    return tags;
  }

  it("never hangs a click on a non-interactive element with no way in", () => {
    const offenders: string[] = [];
    for (const file of ROOTS.flatMap(sourceFiles)) {
      const relative = file.replace(`${process.cwd()}/`, "").replace("app/(experiences)/", "");
      if (relative in EQUIVALENT_ROUTE_EXISTS) continue;
      for (const tag of openingTags(readFileSync(file, "utf8"))) {
        const element = tag.name.replace(/^motion\./, "");
        if (INTERACTIVE.has(element)) continue;
        if (!POINTER.test(tag.attrs)) continue;
        if (KEY_HANDLER.test(tag.attrs) && TAB_STOP.test(tag.attrs)) continue;
        offenders.push(`${relative}: <${tag.name}> takes a pointer event with no keyboard route`);
      }
    }
    expect(offenders.sort()).toEqual(POINTER_ONLY_TODO);
  });

  it("keeps the exception list honest", () => {
    const files = new Set(
      ROOTS.flatMap(sourceFiles).map((file) =>
        file.replace(`${process.cwd()}/`, "").replace("app/(experiences)/", "")
      )
    );
    // An exception for a file that no longer exists is a stale excuse.
    for (const allowed of Object.keys(EQUIVALENT_ROUTE_EXISTS)) {
      expect(files.has(allowed), `${allowed} is listed but not in the tree`).toBe(true);
    }
    for (const reason of Object.values(EQUIVALENT_ROUTE_EXISTS)) {
      expect(reason.length).toBeGreaterThan(30);
    }
  });
});
