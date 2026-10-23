"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "default" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
  secondary: "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--muted)]",
  outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--secondary)]",
  ghost: "bg-transparent hover:bg-[var(--secondary)]",
  destructive: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  default: "h-10 px-4 py-2 rounded-lg",
  lg: "h-12 px-8 rounded-xl text-base",
  icon: "h-10 w-10 rounded-full",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
