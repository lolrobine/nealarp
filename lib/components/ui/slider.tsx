"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  valueText?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, valueText, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id || autoId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium mb-2">
            {label}{" "}
            {valueText && <span className="text-[var(--muted-foreground)]">{valueText}</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="range"
          className={cn(
            "w-full h-2 bg-[var(--secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";
