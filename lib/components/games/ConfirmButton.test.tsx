import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConfirmButton } from "./ConfirmButton";

afterEach(cleanup);

function setup() {
  const onConfirm = vi.fn();
  render(
    <ConfirmButton
      question="Throw away all 10 approvals?"
      confirmLabel="Yes, start again"
      cancelLabel="Keep my answers"
      onConfirm={onConfirm}
    >
      Reset form and saved answers
    </ConfirmButton>
  );
  return {
    onConfirm,
    trigger: screen.getByRole("button", { name: "Reset form and saved answers" }),
  };
}

describe("ConfirmButton", () => {
  it("does not act on the first click", () => {
    const { onConfirm, trigger } = setup();
    fireEvent.click(trigger);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText("Throw away all 10 approvals?")).toBeTruthy();
  });

  it("acts once the question is answered yes", () => {
    const { onConfirm, trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Yes, start again" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Throw away all 10 approvals?")).toBeNull();
  });

  it("leaves everything alone when the question is declined", () => {
    const { onConfirm, trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Keep my answers" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Reset form and saved answers" })).toBeTruthy();
  });

  it("escapes out of the question", () => {
    const { onConfirm, trigger } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("group"), { key: "Escape" });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Reset form and saved answers" })).toBeTruthy();
  });

  it("names the question for assistive technology", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);
    expect(screen.getByRole("group", { name: "Throw away all 10 approvals?" })).toBeTruthy();
  });

  it("moves focus onto the question and hands it back afterwards", () => {
    const { trigger } = setup();
    trigger.focus();
    fireEvent.click(trigger);

    // The trigger it replaced is gone, so focus has to land somewhere
    // deliberate rather than on the document body.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Yes, start again" }));

    fireEvent.click(screen.getByRole("button", { name: "Keep my answers" }));
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Reset form and saved answers" })
    );
  });
});
