"use client";

import { useMemo, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { bankWords, evaluateRows, scoreSquare, SQUARES, type SquareLevel } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

export default function WordSquareStudioPage() {
  const record = usePersonalBest("word-square-studio");
  const [levelIndex, setLevelIndex] = useState(0);
  const level: SquareLevel = SQUARES[levelIndex] ?? SQUARES[0]!;
  const [placed, setPlaced] = useState<(string | null)[]>(() => Array(level.size).fill(null));
  const [bank, setBank] = useState<string[]>(() => bankWords(level));
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState<{ solved: boolean; rowOk: boolean[] } | null>(null);

  const feedback = useMemo(() => (result ? result.rowOk : null), [result]);

  function selectLevel(index: number) {
    const target = SQUARES[index] ?? SQUARES[0]!;
    setLevelIndex(index);
    setPlaced(Array(target.size).fill(null));
    setBank(bankWords(target));
    setSelected(null);
    setResult(null);
  }

  function placeWord(rowIndex: number) {
    if (!selected || result?.solved) return;
    const next = [...placed];
    const previous = next[rowIndex];
    next[rowIndex] = selected;
    setPlaced(next);
    setBank((b) => [...b.filter((w) => w !== selected), ...(previous ? [previous] : [])]);
    setSelected(null);
  }

  function removeRow(rowIndex: number) {
    const word = placed[rowIndex];
    if (!word || result?.solved) return;
    const next = [...placed];
    next[rowIndex] = null;
    setPlaced(next);
    setBank((b) => [...b, word]);
  }

  function check() {
    const evaluation = evaluateRows(level, placed);
    setResult({ solved: evaluation.solved, rowOk: evaluation.rowOk });
    if (!evaluation.solved) setWrongChecks((n) => n + 1);
    else {
      record.save(scoreSquare(wrongChecks, hints));
    }
  }

  return (
    <GameFrame
      id="word-square-studio"
      title="Word Square Studio"
      intro="Place the words so the square reads the same across and down. The word list holds everything you need plus a couple of decoys."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Levels">
          {SQUARES.map((s, i) => (
            <Button
              key={s.id}
              variant={i === levelIndex ? "default" : "outline"}
              onClick={() => selectLevel(i)}
              aria-pressed={i === levelIndex}
            >
              {s.size}×{s.size} · {i + 1}
            </Button>
          ))}
        </div>

        <div className="mx-auto grid gap-2" style={{ width: "min(92vw, 380px)" }}>
          {placed.map((word, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 text-sm text-[var(--muted-foreground)]" aria-hidden="true">
                {i + 1}
              </span>
              <Button
                variant={feedback?.[i] ? "default" : "secondary"}
                className="h-12 flex-1 justify-start text-lg font-mono uppercase tracking-widest"
                onClick={() => (word ? removeRow(i) : placeWord(i))}
                aria-label={
                  word
                    ? `Row ${i + 1}: ${word}. Activate to return it to the bank.`
                    : `Row ${i + 1}: empty. ${selected ? `Place ${selected}.` : "Select a word first."}`
                }
              >
                {word ?? "\u00a0"}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2" role="list" aria-label="Word bank">
          {bank.map((word) => (
            <Button
              key={word}
              variant={selected === word ? "default" : "outline"}
              className="font-mono uppercase tracking-widest"
              onClick={() => setSelected(selected === word ? null : word)}
              aria-pressed={selected === word}
            >
              {word}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={check} disabled={placed.some((w) => !w) || result?.solved === true}>
            Check square
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setHints((h) => h + 1);
              setSelected(level.rows[0] ?? null);
            }}
            disabled={result?.solved === true}
          >
            Reveal first word
          </Button>
        </div>

        {result && !result.solved && (
          <p className="text-center text-[var(--muted-foreground)]" aria-live="polite">
            {result.rowOk.filter(Boolean).length} of {level.size} rows match. Keep rearranging.
          </p>
        )}
        {result?.solved && (
          <WinScreen
            headline="Square complete"
            score={scoreSquare(wrongChecks, hints)}
            detail={level.rows.join(" / ").toUpperCase()}
          />
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Solving a square without checks">
        <ExampleStep n={1}>
          Start with the longest word — it fixes a full row <em>and</em> its crossing column.
        </ExampleStep>
        <ExampleStep n={2}>
          The list holds every answer plus two decoys. A decoy fits its own row but breaks a
          crossing — trust the crossings over the fit.
        </ExampleStep>
        <ExampleResult>No wrong checks, no hints: 100 − 6 × wrong − 3 × hints = 100.</ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
