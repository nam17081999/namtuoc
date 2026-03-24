/** Hiển thị số tiền dạng "1 000 000" (nhóm 3 chữ số, dấu cách). */
export function formatMoneyGroupedSpaces(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const n = Math.floor(Math.abs(value));
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Parse ô nhập đã format — chỉ giữ chữ số. */
export function parseMoneyDigits(raw: string): number {
  const d = raw.replace(/\D/g, "");
  if (d === "") return 0;
  const n = Number.parseInt(d, 10);
  return Number.isFinite(n) ? Math.min(n, Number.MAX_SAFE_INTEGER) : 0;
}


