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
          /*
           * No appearance-none here. Switching it off hands you the track and
           * the thumb, and this project never styled ::-webkit-slider-thumb,
           * so the thumb was simply not drawn and accent-color stopped
           * applying as well. Native rendering plus accent-color is what the
           * sliders on the other screens already use, and it keeps a visible
           * handle. Height comes from the min-height rule in globals.css.
           */
          className={cn("w-full cursor-pointer accent-[var(--primary)]", className)}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";
