export type ResultCard = { title: string; mode: string; score: number };
export async function downloadResultCard({ title, mode, score }: ResultCard) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export unavailable");
  const gradient = context.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#312e81");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 630);
  context.strokeStyle = "#6366f1";
  context.lineWidth = 2;
  context.strokeRect(30, 30, 1140, 570);
  context.fillStyle = "#a5b4fc";
  context.font = "bold 22px sans-serif";
  context.fillText("NEALARP / SINGLEPLAYER", 70, 95);
  context.fillStyle = "#ffffff";
  context.font = "bold 52px sans-serif";
  const words = title.split(" ");
  let line = "",
    y = 180;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > 1040 && line) {
      context.fillText(line, 70, y);
      y += 62;
      line = word;
    } else line = next;
  }
  context.fillText(line, 70, y);
  context.font = "24px sans-serif";
  context.fillStyle = "#cbd5e1";
  context.fillText(mode.slice(0, 80), 70, y + 55);
  context.font = "bold 110px sans-serif";
  context.fillStyle = "#ffffff";
  context.fillText(`${score.toFixed(1)} / 100`, 70, 440);
  context.fillStyle = "#38bdf8";
  context.fillRect(70, 475, (1060 * Math.max(0, Math.min(100, score))) / 100, 9);
  context.font = "20px sans-serif";
  context.fillStyle = "#a5b4fc";
  context.fillText("Your personal best · Saved locally · No leaderboard", 70, 555);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Image export failed"))),
      "image/png"
    )
  );
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = `nealarp-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-result.png`;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
