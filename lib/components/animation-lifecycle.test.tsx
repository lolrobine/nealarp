import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Confetti } from "./Confetti";
import { ImpactBurst } from "@/app/(experiences)/asteroid-launcher/ImpactBurst";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("confetti expires once, restarts only after reactivation, and cleans its timer", () => {
  vi.useFakeTimers();
  const { container, rerender, unmount } = render(<Confetti active />);
  expect(container.querySelectorAll(".absolute")).toHaveLength(30);
  act(() => vi.advanceTimersByTime(4000));
  expect(container.innerHTML).toBe("");
  rerender(<Confetti active />);
  expect(container.innerHTML).toBe("");
  rerender(<Confetti active={false} />);
  rerender(<Confetti active />);
  expect(container.querySelectorAll(".absolute")).toHaveLength(30);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("old impacts do not replay and a new impact disappears on schedule", () => {
  vi.useFakeTimers();
  vi.setSystemTime(10000);
  const { queryByText, rerender, unmount } = render(
    <ImpactBurst timestamp={0} magnitude={2}>
      Old impact
    </ImpactBurst>
  );
  expect(queryByText("Old impact")).toBeNull();
  rerender(
    <ImpactBurst key="new" timestamp={10000} magnitude={2}>
      New impact
    </ImpactBurst>
  );
  expect(queryByText("New impact")).not.toBeNull();
  act(() => vi.advanceTimersByTime(1160));
  expect(queryByText("New impact")).toBeNull();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
