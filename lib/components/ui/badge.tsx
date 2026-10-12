"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "secondary" | "outline" | "primary";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[var(--secondary)] text-[var(--muted-foreground)]",
  secondary: "bg-[var(--secondary)] text-[var(--foreground)]",
  outline: "border border-[var(--border)]",
  primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
