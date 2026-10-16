import { seededRandom, seededShuffle } from "@/lib/games/daily";
export type Question = {
  category: "speed" | "size";
  left: string;
  right: string;
  a: number;
  b: number;
  explanation: string;
};
export const QUESTIONS: Question[] = [
  {
    category: "speed",
    left: "Red rover: 120 m in 6 s",
    right: "Blue rover: 90 m in 3 s",
    a: 20,
    b: 30,
    explanation: "Speed = distance ÷ time. Red: 20 m/s; blue: 30 m/s.",
  },
  {
    category: "size",
    left: "Square: side 8 units",
    right: "Rectangle: 9 × 6 units",
    a: 64,
    b: 54,
    explanation: "Area = width × height. Square: 64; rectangle: 54 square units.",
  },
  {
    category: "speed",
    left: "Comet drone: 72 km/h",
    right: "Orbit drone: 25 m/s",
    a: 20,
    b: 25,
    explanation: "72 km/h ÷ 3.6 = 20 m/s. Orbit wins at 25 m/s.",
  },
  {
    category: "size",
    left: "Cube: side 4 units",
    right: "Box: 3 × 5 × 5 units",
    a: 64,
    b: 75,
    explanation: "Volume = width × height × depth. Cube: 64; box: 75 cubic units.",
  },
  {
    category: "speed",
    left: "Amber bot: 300 m in 15 s",
    right: "Jade bot: 100 m in 4 s",
    a: 20,
    b: 25,
    explanation: "Amber: 20 m/s; jade: 25 m/s.",
  },
  {
    category: "size",
    left: "Square: side 12 units",
    right: "Rectangle: 10 × 15 units",
    a: 144,
    b: 150,
    explanation: "Square: 144; rectangle: 150 square units.",
  },
  {
    category: "speed",
    left: "Silver cart: 54 km/h",
    right: "Gold cart: 12 m/s",
    a: 15,
    b: 12,
    explanation: "54 km/h ÷ 3.6 = 15 m/s, greater than 12 m/s.",
  },
  {
    category: "size",
    left: "Cube: side 5 units",
    right: "Box: 4 × 4 × 7 units",
    a: 125,
    b: 112,
    explanation: "Cube: 125; box: 112 cubic units.",
  },
  {
    category: "speed",
    left: "Swift ship: 2 km in 40 s",
    right: "Quiet ship: 900 m in 15 s",
    a: 50,
    b: 60,
    explanation: "Swift: 2000 ÷ 40 = 50 m/s; quiet: 900 ÷ 15 = 60 m/s.",
  },
  {
    category: "size",
    left: "Rectangle: 13 × 7 units",
    right: "Square: side 9 units",
    a: 91,
    b: 81,
    explanation: "Rectangle: 91; square: 81 square units.",
  },
];
export function isCorrect(q: Question, side: "left" | "right") {
  return side === (q.a > q.b ? "left" : "right");
}

export function dailyQuestions(day: string): Question[] {
  const random = seededRandom(`which-is-more:swap:v1:${day}`);
  return seededShuffle(QUESTIONS, `which-is-more:order:v1:${day}`).map((q) =>
    random() < 0.5 ? { ...q } : { ...q, left: q.right, right: q.left, a: q.b, b: q.a }
  );
}
