import type { ReactNode } from "react";

/**
 * Drawn replacements for the emoji that used to sit in game UI.
 *
 * Emoji were doing real work here — marking a rule as passed, labelling a
 * terrain, standing in for a creature — and they are the wrong tool for it:
 * every platform draws them differently, several are invisible in a
 * monochrome or high-contrast rendering, and screen readers announce names
 * nobody chose ("party popper"). These are plain SVG on `currentColor`, so
 * they inherit the surrounding text colour and size.
 *
 * All of them are decorative: the text beside them always carries the
 * meaning, and the icon is aria-hidden.
 */
export type PictoName =
  // interface
  | "check"
  | "cross"
  | "bulb"
  | "copy"
  | "share"
  | "image"
  | "timer"
  | "trophy"
  | "sound-on"
  | "sound-off"
  | "rocket"
  | "pause"
  | "flag"
  | "globe"
  | "moon"
  | "search"
  | "map"
  | "asteroid"
  // asteroid-launcher terrain
  | "ocean"
  | "desert"
  | "rural"
  | "suburb"
  | "city"
  | "megacity"
  // speed categories
  | "animals"
  | "vehicles"
  | "tech"
  | "nature"
  // life-stats
  | "heart"
  | "lungs"
  | "eye"
  | "bed"
  | "footprint"
  | "meal"
  | "orbit"
  | "sunrise"
  | "speech"
  | "smile"
  | "scissors"
  | "droplet"
  | "galaxy"
  | "planet"
  | "refresh"
  | "sprout"
  // deep-sea creature silhouettes
  | "fish"
  | "shark"
  | "cephalopod"
  | "turtle"
  | "dolphin"
  | "worm"
  | "jelly"
  | "crustacean";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
const R = { ...S, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const SHAPES: Record<PictoName, ReactNode> = {
  check: <path d="M4 12.5 9.5 18 20 6.5" {...R} />,
  cross: <path d="M6 6 18 18M18 6 6 18" {...R} />,
  bulb: (
    <>
      <path d="M9.5 18h5M10 21h4" {...R} />
      <path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z" {...R} />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" {...R} />
      <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15" {...R} />
    </>
  ),
  share: (
    <>
      <path d="M12 16V4M12 4 7.5 8.5M12 4l4.5 4.5" {...R} />
      <path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14" {...R} />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" {...R} />
      <circle cx="8.5" cy="10" r="1.6" {...R} />
      <path d="m4 17 5-4.5 4 3.2 3-2.4 4 3.7" {...R} />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" {...R} />
      <path d="M12 9.5v4l2.5 2M9 2.5h6" {...R} />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" {...R} />
      <path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11" {...R} />
      <path d="M12 14v3.5M8.5 20.5h7" {...R} />
    </>
  ),
  "sound-on": (
    <>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" {...R} />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...R} />
    </>
  ),
  "sound-off": (
    <>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" {...R} />
      <path d="m16 9.5 5 5M21 9.5l-5 5" {...R} />
    </>
  ),
  rocket: (
    <>
      <path d="M12 2.5c3 2.4 4.5 5.8 4.5 9.4L12 17l-4.5-5.1c0-3.6 1.5-7 4.5-9.4Z" {...R} />
      <circle cx="12" cy="10" r="1.8" {...R} />
      <path d="M9 16.5 6.5 21l4-1.2M15 16.5 17.5 21l-4-1.2" {...R} />
    </>
  ),
  pause: <path d="M9 5v14M15 5v14" {...R} />,
  flag: (
    <>
      <path d="M6 21V4" {...R} />
      <path d="M6 4.5h12l-2.5 4 2.5 4H6Z" {...R} />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" {...R} />
      <path
        d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.3 3.3 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.3-5.3-3.3-8.5S9.8 5.8 12 3.5Z"
        {...R}
      />
    </>
  ),
  moon: <path d="M19 14.5A8 8 0 0 1 9 4.6a8.5 8.5 0 1 0 10 9.9Z" {...R} />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" {...R} />
      <path d="m15.5 15.5 4.5 4.5" {...R} />
    </>
  ),
  map: (
    <>
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" {...R} />
      <path d="M9 4v13.5M15 6.5V20" {...R} />
    </>
  ),
  asteroid: (
    <>
      <path
        d="M13.5 5.5c3.6 0 6.5 2.7 6.5 6s-2.9 6.5-6.5 6.5S6 15.1 6 11.8s3.9-6.3 7.5-6.3Z"
        {...R}
      />
      <circle cx="11" cy="10" r="1.4" {...R} />
      <circle cx="15.5" cy="13.5" r="1" {...R} />
      <path d="M5 5 2.5 2.5M8 3.5 7 1M3.5 8 1 7" {...R} />
    </>
  ),
  ocean: (
    <path
      d="M2.5 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2.5 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2.5 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
      {...R}
    />
  ),
  desert: (
    <>
      <path d="M2.5 19h19" {...R} />
      <path d="M12 19V9M12 13c-2.5 0-3.5-1.5-3.5-3.5M12 11.5c2.5 0 3.5-1.5 3.5-3.5" {...R} />
      <path d="M3 19c1.5-2.5 3.5-2.5 5 0M16 19c1.5-2 3-2 4.5 0" {...R} />
    </>
  ),
  rural: (
    <>
      <path d="M2.5 19h19" {...R} />
      <path d="M6 19v-6M10 19v-7M14 19v-6M18 19v-7" {...R} />
      <path
        d="M6 13c-1-1.5-1-3 0-4.5 1 1.5 1 3 0 4.5ZM10 12c-1-1.5-1-3 0-4.5 1 1.5 1 3 0 4.5ZM14 13c-1-1.5-1-3 0-4.5 1 1.5 1 3 0 4.5ZM18 12c-1-1.5-1-3 0-4.5 1 1.5 1 3 0 4.5Z"
        {...R}
      />
    </>
  ),
  suburb: (
    <>
      <path d="M2.5 19.5h19" {...R} />
      <path d="M3.5 19.5v-6L8 10l4.5 3.5v6Z" {...R} />
      <path d="M13.5 19.5v-4.5L17 12.5l3.5 2.5v4.5Z" {...R} />
    </>
  ),
  city: (
    <>
      <path d="M2.5 19.5h19" {...R} />
      <path d="M4 19.5V11h5v8.5M11 19.5V5h5v14.5M18 19.5v-6h2.5v6" {...R} />
      <path d="M6 14h1M13 8h1M13 12h1" {...R} />
    </>
  ),
  megacity: (
    <>
      <path d="M2 20h20" {...R} />
      <path d="M3 20V13h3v7M7.5 20V9h3v11M12 20V3h3.5v17M17 20v-9h4v9" {...R} />
    </>
  ),
  animals: (
    <>
      <path
        d="M12 20c-3.3 0-5.5-2-5.5-4.3 0-2.2 2.2-3.7 5.5-3.7s5.5 1.5 5.5 3.7C17.5 18 15.3 20 12 20Z"
        {...R}
      />
      <ellipse cx="6" cy="8.5" rx="2" ry="2.8" {...R} />
      <ellipse cx="18" cy="8.5" rx="2" ry="2.8" {...R} />
      <ellipse cx="10" cy="5.5" rx="1.8" ry="2.5" {...R} />
      <ellipse cx="14.5" cy="5.5" rx="1.8" ry="2.5" {...R} />
    </>
  ),
  vehicles: (
    <>
      <path d="M3 15.5v-2l1.8-4A2 2 0 0 1 6.7 8h10.6a2 2 0 0 1 1.9 1.4l1.8 4v2" {...R} />
      <path d="M3 15.5h18M5.5 15.5v2M18.5 15.5v2" {...R} />
      <circle cx="7" cy="15.5" r="1.8" {...R} />
      <circle cx="17" cy="15.5" r="1.8" {...R} />
    </>
  ),
  tech: (
    <>
      <rect x="8" y="8" width="8" height="8" rx="1.5" {...R} />
      <path d="M11 4v4M14 4v4M11 16v4M14 16v4M4 11h4M4 14h4M16 11h4M16 14h4" {...R} />
    </>
  ),
  nature: (
    <>
      <path d="M12 21c0-5 0-8 0-8" {...R} />
      <path d="M12 13c-4 0-6-2.5-6-6 4 0 6 2.5 6 6ZM12 13c4 0 6-2.5 6-6-4 0-6 2.5-6 6Z" {...R} />
    </>
  ),
  heart: <path d="M12 20.5 4.5 13a4.8 4.8 0 0 1 7.5-5.9A4.8 4.8 0 0 1 19.5 13Z" {...R} />,
  lungs: (
    <>
      <path d="M12 3v9" {...R} />
      <path
        d="M12 8c-1.5-1.5-3-1.5-4.5 0S5 12 5 15.5A2.5 2.5 0 0 0 7.5 18h1A2.5 2.5 0 0 0 11 15.5V9"
        {...R}
      />
      <path
        d="M12 8c1.5-1.5 3-1.5 4.5 0S19 12 19 15.5A2.5 2.5 0 0 1 16.5 18h-1A2.5 2.5 0 0 1 13 15.5V9"
        {...R}
      />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" {...R} />
      <circle cx="12" cy="12" r="2.8" {...R} />
    </>
  ),
  bed: (
    <>
      <path d="M3 19v-9M3 13h18v6M21 19v-6" {...R} />
      <path d="M7 13v-2.5A1.5 1.5 0 0 1 8.5 9h8a1.5 1.5 0 0 1 1.5 1.5V13" {...R} />
      <circle cx="7" cy="11.5" r="1.4" {...R} />
    </>
  ),
  footprint: (
    <>
      <ellipse cx="10" cy="13" rx="4" ry="6" {...R} />
      <ellipse cx="17.5" cy="7" rx="2" ry="2.5" {...R} />
      <path d="M7.5 19.5c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5" {...R} />
    </>
  ),
  meal: (
    <>
      <circle cx="12" cy="12" r="8.5" {...R} />
      <circle cx="12" cy="12" r="4.5" {...R} />
    </>
  ),
  orbit: (
    <>
      <circle cx="12" cy="12" r="3" {...R} />
      <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-25 12 12)" {...R} />
      <circle cx="20" cy="8.5" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  sunrise: (
    <>
      <path d="M2.5 19h19M6 15a6 6 0 0 1 12 0Z" {...R} />
      <path d="M12 3v3M4.5 7.5 6.5 9.5M19.5 7.5 17.5 9.5" {...R} />
    </>
  ),
  speech: (
    <path
      d="M20 14.5A1.5 1.5 0 0 1 18.5 16H9l-4 3.5V5.5A1.5 1.5 0 0 1 6.5 4h12A1.5 1.5 0 0 1 20 5.5Z"
      {...R}
    />
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="8.5" {...R} />
      <path d="M8 13.5a4.5 4.5 0 0 0 8 0" {...R} />
      <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6.5" cy="18" r="2.5" {...R} />
      <circle cx="17.5" cy="18" r="2.5" {...R} />
      <path d="M8.5 16 18 3M15.5 16 6 3" {...R} />
    </>
  ),
  droplet: (
    <path d="M12 3c3.5 4.2 5.5 7.3 5.5 9.8A5.5 5.5 0 0 1 6.5 12.8C6.5 10.3 8.5 7.2 12 3Z" {...R} />
  ),
  galaxy: (
    <>
      <path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" {...R} />
      <path d="M15 10c3-2 6-1.5 6 1.5s-4 7-9 7-8-2.5-8-5.5" {...R} />
      <path d="M9 14c-3 2-6 1.5-6-1.5s4-7 9-7 8 2.5 8 5.5" {...R} />
    </>
  ),
  planet: (
    <>
      <circle cx="12" cy="11" r="6" {...R} />
      <ellipse cx="12" cy="13.5" rx="11" ry="3.2" transform="rotate(-18 12 13.5)" {...R} />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" {...R} />
      <path d="M20.5 3v5h-5" {...R} />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-8" {...R} />
      <path
        d="M12 13C12 9 9.5 6.5 5.5 6.5 5.5 10.5 8 13 12 13ZM12 13c0-3.3 2-5.5 5.5-5.5C17.5 10.8 15.5 13 12 13Z"
        {...R}
      />
    </>
  ),
  fish: (
    <>
      <path
        d="M3.5 12c3-4 7-5.5 11-4.5 2.5.6 4.5 2.4 6 4.5-1.5 2.1-3.5 3.9-6 4.5-4 1-8-.5-11-4.5Z"
        {...R}
      />
      <path d="m20.5 12 .5-3.5M20.5 12l.5 3.5" {...R} />
      <circle cx="7.5" cy="11" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  shark: (
    <>
      <path
        d="M2.5 14c3-3.5 7-5 11-4.6 2.8.3 5.3 1.7 7.5 3.6-2.2 1.9-4.7 3.3-7.5 3.6-4 .4-8-1.1-11-2.6Z"
        {...R}
      />
      <path d="M11 9.4 12.5 4l3.5 6" {...R} />
      <path d="m21 13-.5 3.5" {...R} />
      <circle cx="6.5" cy="13" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  cephalopod: (
    <>
      <path d="M7 10.5a5 5 0 0 1 10 0v2.5H7Z" {...R} />
      <path
        d="M8 13c0 3-1.5 4.5-3 6M11 13c0 3.5-.5 5.5-1 7M13 13c0 3.5.5 5.5 1 7M16 13c0 3 1.5 4.5 3 6"
        {...R}
      />
      <circle cx="10" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="10" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  turtle: (
    <>
      <path d="M4.5 14a7.5 7.5 0 0 1 15 0Z" {...R} />
      <path d="M12 6.5v7.5M7.5 8.5l2 5.5M16.5 8.5l-2 5.5" {...R} />
      <path d="M5 14v2.5M19 14v2.5M20 11.5c1.3-.4 2 0 2 1.2" {...R} />
    </>
  ),
  dolphin: (
    <>
      <path
        d="M2.5 16c2.5-6.5 7.5-10 13-9.5-1 2-1 3.8 0 5.5 2 .3 3.5 1.3 4.5 3-3.5 2.5-7.5 3.5-12 3Z"
        {...R}
      />
      <path d="M8 15c-1.5 1.8-3.5 2.5-5.5 2" {...R} />
      <circle cx="16" cy="9" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  worm: (
    <>
      <path d="M8 21V9a4 4 0 0 1 8 0v12" {...R} />
      <path d="M8 9c-1.5-1.5-1.5-3.5 0-5M16 9c1.5-1.5 1.5-3.5 0-5" {...R} />
      <path d="M8 13h8M8 17h8" {...R} />
    </>
  ),
  jelly: (
    <>
      <path d="M5 12a7 7 0 0 1 14 0v1.5H5Z" {...R} />
      <path
        d="M7.5 13.5c0 4-1 5.5-2 7M11 13.5c0 4.5-.5 6-1 7.5M13 13.5c0 4.5.5 6 1 7.5M16.5 13.5c0 4 1 5.5 2 7"
        {...R}
      />
    </>
  ),
  crustacean: (
    <>
      <ellipse cx="12" cy="13" rx="5.5" ry="4" {...R} />
      <path d="M7 10 4 6.5M17 10l3-3.5M4 6.5 2 8.5M20 6.5 22 8.5" {...R} />
      <path d="M7.5 16.5 5 19M10 17v3M14 17v3M16.5 16.5 19 19" {...R} />
    </>
  ),
};

export function Picto({
  name,
  size = 18,
  className,
}: {
  name: PictoName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.15em", flexShrink: 0 }}
    >
      {SHAPES[name]}
    </svg>
  );
}

/** Deep Sea has twenty creatures and no art budget for twenty drawings, so
 *  each one maps to the silhouette of its body plan. Pure, so it is testable. */
export function creatureShape(name: string): PictoName {
  const n = name.toLowerCase();
  if (n.includes("shark")) return "shark";
  if (n.includes("squid") || n.includes("octopus") || n.includes("nautilus")) return "cephalopod";
  if (n.includes("turtle")) return "turtle";
  if (n.includes("dolphin") || n.includes("whale") || n.includes("porpoise")) return "dolphin";
  if (n.includes("worm") || n.includes("cucumber") || n.includes("eel")) return "worm";
  if (n.includes("jelly") || n.includes("siphonophore")) return "jelly";
  if (n.includes("crab") || n.includes("shrimp") || n.includes("isopod") || n.includes("lobster"))
    return "crustacean";
  return "fish";
}
