export type VnGoldQuote = {
  vndPerChi: number;
  name: string;
  buyPerLuong: number;
  sellPerLuong: number;
  avgPerLuong: number;
  source: string;
};

/**
 * Giá vàng Việt Nam (SJC 9999 / lượng) qua API công khai, quy đổi VNĐ/chỉ.
 * Gọi route nội bộ `/api/gold-vn` để tránh CORS và cache phía server.
 */
export async function fetchVnGoldQuote(): Promise<VnGoldQuote> {
  const res = await fetch("/api/gold-vn", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  const json = (await res.json()) as VnGoldQuote & { error?: string };
  if (!res.ok || json.error || typeof json.vndPerChi !== "number") {
    throw new Error(json.error ?? "Không lấy được giá vàng VN");
  }
  return {
    vndPerChi: json.vndPerChi,
    name: json.name,
    buyPerLuong: json.buyPerLuong,
    sellPerLuong: json.sellPerLuong,
    avgPerLuong: json.avgPerLuong,
    source: json.source
  };
}
