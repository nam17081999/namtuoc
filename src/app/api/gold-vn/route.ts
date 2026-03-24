import { NextResponse } from "next/server";

/** 1 lượng (SJC) = 10 chỉ — chuẩn giá niêm yết VN. */
const CHI_PER_LUONG = 10;

const SOURCES = [
  "https://www.vang.today/api/prices",
  "https://giavang.now/api/prices"
] as const;

/** SJC 9999 — mã phổ biến trên các API giá vàng VN. */
const SJC_KEY = "SJL1L10";

type VangTodayPayload = {
  success?: boolean;
  prices?: Record<string, { name?: string; buy?: number; sell?: number; currency?: string }>;
};

export async function GET() {
  let lastErr: unknown;
  for (const url of SOURCES) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 180 }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as VangTodayPayload;
      const p = json.prices?.[SJC_KEY];
      if (!p || p.currency !== "VND") throw new Error("Missing SJC VND");
      const buy = Number(p.buy);
      const sell = Number(p.sell);
      if (!Number.isFinite(buy) || !Number.isFinite(sell)) throw new Error("Invalid prices");
      const avgPerLuong = (buy + sell) / 2;
      const vndPerChi = avgPerLuong / CHI_PER_LUONG;
      return NextResponse.json({
        vndPerChi,
        name: p.name ?? "SJC 9999",
        buyPerLuong: buy,
        sellPerLuong: sell,
        avgPerLuong,
        source: url.includes("vang.today") ? "vang.today" : "giavang.now"
      });
    } catch (e) {
      lastErr = e;
    }
  }
  console.error("[gold-vn]", lastErr);
  return NextResponse.json({ error: "Không lấy được giá vàng VN." }, { status: 502 });
}


