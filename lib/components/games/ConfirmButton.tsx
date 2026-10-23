"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/lib/components/ui/button";

interface ConfirmButtonProps {
  /** Text on the button that opens the question. */
  children: React.ReactNode;
  /** The question itself, e.g. "Delete your ten saved approvals?" */
  question: string;
  /** Text on the button that goes through with it. */
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

/**
 * A destructive action that asks first.
 *
 * Wiping saved progress has no undo, so a single stray click should not be
 * able to do it. Focus follows the exchange: opening the question moves focus
 * to the confirming button, and answering it either way puts focus back on the
 * trigger, so a keyboard or screen reader user is never dropped on the body.
 */
export function ConfirmButton({
  children,
  question,
  confirmLabel,
  cancelLabel = "Keep it",
  onConfirm,
}: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const wasAsking = useRef(false);

  useEffect(() => {
    if (asking) {
      wasAsking.current = true;
      confirmRef.current?.focus();
    } else if (wasAsking.current) {
      wasAsking.current = false;
      triggerRef.current?.focus();
    }
  }, [asking]);

  if (!asking) {
    return (
      <Button ref={triggerRef} variant="secondary" onClick={() => setAsking(true)}>
        {children}
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-label={question}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] p-3"
      onKeyDown={(e) => {
        if (e.key === "Escape") setAsking(false);
      }}
    >
      <p className="font-medium">{question}</p>
      <Button
        ref={confirmRef}
        variant="destructive"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </Button>
      <Button variant="secondary" onClick={() => setAsking(false)}>
        {cancelLabel}
      </Button>
    </div>
  );
}
