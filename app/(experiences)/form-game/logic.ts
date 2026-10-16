export const PROMPTS = [
  ["Enter your first name", "Use 2–20 letters, no spaces. Example: Ada."],
  [
    "Choose a username with none of your name’s letters",
    "Use at least three letters. For Ada, try mint.",
  ],
  [
    "State your age as an addition",
    "Two positive whole numbers, such as 20+5. The sum must be 18–120.",
  ],
  ["Explain your request in exactly seven words", "Example: Please let me apply for this permit."],
  ["Type the last word of your explanation", "The seven-word sentence above tells you the answer."],
  ["Enter the number of letters in your username", "Count letters only. For mint, enter 4."],
  [
    "Create a reference with your initials and 42",
    "First letter of your name, then a hyphen, then 42. For Ada: A-42.",
  ],
  ["Acknowledge that this form is not a sandwich", "Type: this form is not a sandwich"],
  ["Reverse the word PERMIT", "Read the six letters from right to left."],
  ["Finish the authorization", "Type: I authorize this authorization"],
] as const;
export function validateAnswer(step: number, input: string, answers: string[]): boolean {
  const s = input.trim();
  const name = answers[0]?.trim() ?? "";
  const username = answers[1]?.trim() ?? "";
  switch (step) {
    case 0:
      return /^[a-z]{2,20}$/i.test(s);
    case 1:
      return (
        /^[a-z]{3,20}$/i.test(s) &&
        ![...s.toLowerCase()].some((c) => name.toLowerCase().includes(c))
      );
    case 2: {
      const m = /^(\d{1,3})\s*\+\s*(\d{1,3})$/.exec(s);
      return (
        !!m &&
        Number(m[1]) > 0 &&
        Number(m[2]) > 0 &&
        Number(m[1]) + Number(m[2]) >= 18 &&
        Number(m[1]) + Number(m[2]) <= 120
      );
    }
    case 3:
      return s.split(/\s+/).length === 7 && /^[a-z ,.!?'-]+$/i.test(s);
    case 4:
      return (
        s.toLowerCase().replace(/[.!?,]/g, "") ===
        answers[3]
          ?.trim()
          .split(/\s+/)
          .at(-1)
          ?.toLowerCase()
          .replace(/[.!?,]/g, "")
      );
    case 5:
      return s === String(username.length);
    case 6:
      return s === `${name[0]?.toUpperCase()}-42`;
    case 7:
      return s.toLowerCase() === "this form is not a sandwich";
    case 8:
      return s === "TIMREP";
    case 9:
      return s === "I authorize this authorization";
    default:
      return false;
  }
}
export type FormProgress = { answers: string[] };
export const EMPTY_FORM: FormProgress = { answers: [] };
export function isFormProgress(value: unknown): value is FormProgress {
  if (
    !value ||
    typeof value !== "object" ||
    !("answers" in value) ||
    !Array.isArray(value.answers) ||
    value.answers.length > 10
  )
    return false;
  const answers = value.answers;
  return answers.every(
    (answer: unknown, i: number) =>
      typeof answer === "string" && answer.length <= 200 && validateAnswer(i, answer, answers)
  );
}
