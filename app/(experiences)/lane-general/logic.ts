import { seededRandom } from "@/lib/games/daily";

/** Lane General: a small auto-battler where you draft a line-up of three units and
 * watch a deterministic right-to-left resolver decide the fight. Stats are visible,
 * the resolver is pure, and the same line-ups always produce the same outcome
 * (inspired by Super Auto Pets; original units and numbers). */

export type Unit = {
  id: string;
  name: string;
  attack: number;
  health: number;
  trait: "swift" | "sturdy" | "jolly";
};

export const UNITS: Unit[] = [
  { id: "pip", name: "Pip", attack: 2, health: 3, trait: "swift" },
  { id: "bumble", name: "Bumble", attack: 1, health: 5, trait: "sturdy" },
  { id: "zest", name: "Zest", attack: 3, health: 2, trait: "jolly" },
  { id: "tuck", name: "Tuck", attack: 2, health: 4, trait: "sturdy" },
  { id: "flick", name: "Flick", attack: 4, health: 1, trait: "swift" },
  { id: "moss", name: "Moss", attack: 1, health: 6, trait: "sturdy" },
  { id: "cheep", name: "Cheep", attack: 3, health: 3, trait: "jolly" },
  { id: "bramble", name: "Bramble", attack: 2, health: 2, trait: "jolly" },
  { id: "waddle", name: "Waddle", attack: 1, health: 4, trait: "swift" },
];

export type Lineup = [Unit, Unit, Unit];
export type FightStep = {
  attacker: string;
  target: string;
  damage: number;
  targetHealthLeft: number;
};
export type FightResult = {
  winner: "player" | "enemy" | "draw";
  steps: FightStep[];
  playerSurvivors: string[];
  enemySurvivors: string[];
};

/** Right-to-left resolver: units alternate attacks from the right end of each line.
 * Swift strikes first on its first turn; sturdy halves the first damage it takes
 * (rounded down); jolly units deal +1 when below half health. Pure and order-fixed. */
export function resolveFight(player: Lineup, enemy: Lineup): FightResult {
  const p = player.map((u) => ({ ...u, hp: u.health, usedTrait: false }));
  const e = enemy.map((u) => ({ ...u, hp: u.health, usedTrait: false }));
  const steps: FightStep[] = [];
  let turn = 0;
  let pIndex = p.length - 1;
  let eIndex = e.length - 1;
  // Right-to-left: start with each side's rightmost living unit.
  const alive = (side: typeof p) => side.some((u) => u.hp > 0);
  const currentOf = (side: typeof p, idx: number) => {
    for (let i = idx; i >= 0; i--) if (side[i]!.hp > 0) return i;
    return -1;
  };
  let firstStrikeGiven = false;
  while (alive(p) && alive(e) && steps.length < 100) {
    const playerTurn = turn % 2 === 0;
    const side = playerTurn ? p : e;
    const other = playerTurn ? e : p;
    const idx = currentOf(side, playerTurn ? pIndex : eIndex);
    if (idx < 0) break;
    if (playerTurn) pIndex = idx;
    else eIndex = idx;
    const attacker = side[idx]!;
    const targetIdx = currentOf(other, other.length - 1);
    if (targetIdx < 0) break;
    const target = other[targetIdx]!;
    let damage = attacker.attack;
    if (attacker.trait === "swift" && !firstStrikeGiven) {
      damage += 1;
      firstStrikeGiven = true;
    }
    if (attacker.trait === "jolly" && attacker.hp < attacker.health / 2) damage += 1;
    if (target.trait === "sturdy" && !target.usedTrait) {
      damage = Math.floor(damage / 2);
      target.usedTrait = true;
    }
    target.hp -= damage;
    steps.push({
      attacker: attacker.name,
      target: target.name,
      damage,
      targetHealthLeft: Math.max(0, target.hp),
    });
    turn += 1;
  }
  const playerWins = alive(p) && !alive(e);
  const enemyWins = alive(e) && !alive(p);
  return {
    winner: playerWins ? "player" : enemyWins ? "enemy" : "draw",
    steps,
    playerSurvivors: p.filter((u) => u.hp > 0).map((u) => u.name),
    enemySurvivors: e.filter((u) => u.hp > 0).map((u) => u.name),
  };
}

/** Three random enemy units from a seeded pool. */
export function enemyLineup(seed: string, round: number): Lineup {
  const random = seededRandom(`${seed}:lane-general:${round}`);
  const picks: Unit[] = [];
  while (picks.length < 3) {
    const unit = UNITS[Math.floor(random() * UNITS.length)]!;
    if (!picks.some((p) => p.id === unit.id)) picks.push(unit);
  }
  return [picks[0]!, picks[1]!, picks[2]!];
}

export function scoreStreak(streak: number, rounds: number): number {
  return Math.max(0, Math.min(100, Math.round((streak / Math.max(1, rounds)) * 100)));
}
