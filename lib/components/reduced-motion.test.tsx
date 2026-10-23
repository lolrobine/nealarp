import { render, screen } from "@testing-library/react";
import { MotionConfigContext } from "framer-motion";
import { useContext } from "react";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "@/lib/components/ThemeProvider";

/**
 * globals.css collapses animation and transition durations for anyone who
 * asks the OS for less motion, which covers everything animated in CSS.
 * framer-motion is not animated in CSS: it drives transforms from
 * JavaScript, and its own default for reducedMotion is "never". So the
 * fourteen files in this project that import it were moving regardless of
 * the setting, with nothing in the stylesheet able to reach them.
 *
 * One MotionConfig at the root fixes all fourteen, which also means one
 * deleted line breaks all fourteen silently. Hence this test.
 */

function ReportedSetting() {
  const config = useContext(MotionConfigContext);
  return <span data-testid="setting">{String(config.reducedMotion)}</span>;
}

describe("motion honours the OS setting", () => {
  it("hands framer-motion the user's preference rather than its own default", () => {
    render(
      <ThemeProvider>
        <ReportedSetting />
      </ThemeProvider>
    );
    expect(screen.getByTestId("setting").textContent).toBe("user");
  });

  it("is not framer-motion's default, which ignores the preference", () => {
    render(<ReportedSetting />);
    // Outside the provider the context falls back to framer's own default.
    expect(screen.getByTestId("setting").textContent).not.toBe("user");
  });
});
