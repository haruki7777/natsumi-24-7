export function readBatchCount(text = "") {
  const max = Math.max(1, Math.min(5, Number(process.env.NATSUMI_IMAGE_MAX_COUNT || 5) || 5));
  const s = String(text || "");
  if (s.includes("5") || s.includes("다섯")) return Math.min(max, 5);
  if (s.includes("4") || s.includes("네")) return Math.min(max, 4);
  if (s.includes("3") || s.includes("세")) return Math.min(max, 3);
  if (s.includes("2") || s.includes("두")) return Math.min(max, 2);
  return 1;
}
