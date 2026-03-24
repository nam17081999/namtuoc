"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MONEY_DENOMINATIONS } from "@/core/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAutosave } from "@/hooks/use-autosave";
import { useCreateMoneySession, useMoneySessionItems, useMoneySessions, useUpsertMoneyItems } from "../hooks";

export function MoneyCounterShell() {
  const { data: sessions = [] } = useMoneySessions();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { data: items = [] } = useMoneySessionItems(sessionId);
  const createSession = useCreateMoneySession();
  const upsertItems = useUpsertMoneyItems();

  const [counts, setCounts] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const sortedDenoms = useMemo(() => [...MONEY_DENOMINATIONS].sort((a, b) => b - a), []);

  useEffect(() => {
    if (!sessionId && sessions.length > 0) {
      setSessionId(sessions[0].id);
    }
  }, [sessionId, sessions]);

  useEffect(() => {
    if (!sessionId) return;
    if (items.length === 0) {
      setCounts({});
      return;
    }
    const next: Record<number, number> = {};
    items.forEach((item) => {
      next[item.denomination] = item.quantity;
    });
    setCounts(next);
  }, [items, sessionId]);

  const total = useMemo(() => {
    return MONEY_DENOMINATIONS.reduce((sum, denom) => {
      const qty = counts[denom] ?? 0;
      return sum + denom * qty;
    }, 0);
  }, [counts]);

  const handleChange = (denom: number, value: string) => {
    const qty = Math.max(0, Number.parseInt(value || "0", 10));
    setCounts((prev) => ({ ...prev, [denom]: Number.isNaN(qty) ? 0 : qty }));
  };

  const handleReset = () => {
    setCounts({});
    setStatus("idle");
  };

  const handleNewSession = async () => {
    const session = await createSession.mutateAsync();
    setSessionId(session.id);
    setCounts({});
    setStatus("idle");
  };

  const saveSession = async () => {
    setStatus("saving");
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const session = await createSession.mutateAsync();
      currentSessionId = session.id;
      setSessionId(session.id);
    }
    const payload = MONEY_DENOMINATIONS.map((denom) => ({
      denomination: denom,
      quantity: counts[denom] ?? 0
    }));

    await upsertItems.mutateAsync({ sessionId: currentSessionId, items: payload });
    setStatus("saved");
  };

  useAutosave(saveSession, 15000, [counts, sessionId]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-3xl bg-background/60 p-4 shadow-sm ring-1 ring-border/40 lg:flex-row">
      <div className="flex w-full flex-col gap-3 rounded-2xl bg-card/70 p-3 ring-1 ring-border/40 lg:w-[260px]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Phiên đã lưu</p>
          <Button size="sm" variant="secondary" className="rounded-full px-3 text-[11px]" onClick={() => void handleNewSession()}>
            Tạo phiên
          </Button>
        </div>
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-[12px] text-muted">Chưa có phiên nào.</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSessionId(session.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-[12px] transition ${
                  sessionId === session.id ? "bg-amber-500 text-[#0c0f18]" : "bg-background/80 text-text"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{new Date(session.created_at).toLocaleDateString("vi-VN")}</span>
                  <span className="text-[10px] opacity-70">
                    {new Date(session.updated_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 lg:flex-1">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-muted">TỔNG TIỀN</p>
            <p className="font-display text-4xl font-semibold tracking-tight text-text break-all">
              {total.toLocaleString("vi-VN")} đ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full px-3 text-[11px] text-muted hover:text-text bg-card/60"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full px-4 text-xs font-medium shadow-sm"
              onClick={saveSession}
            >
              LƯU NGAY
            </Button>
          </div>
        </div>

        <Card className="border-0 bg-card/80 shadow-none ring-1 ring-border/40">
          <CardContent className="divide-y divide-border/60 p-0">
            {sortedDenoms.map((denom) => (
              <div key={denom} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-text">{denom.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 rounded-full px-0 text-muted hover:bg-card hover:text-text"
                    onClick={() => setCounts((prev) => ({ ...prev, [denom]: Math.max(0, (prev[denom] ?? 0) - 1) }))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="h-8 w-16 px-1 rounded-2xl border-border/80 bg-background text-center text-sm font-medium"
                    value={counts[denom] ?? ""}
                    onChange={(event) => handleChange(denom, event.target.value)}
                    placeholder="0"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 rounded-full px-0 text-muted hover:bg-card hover:text-text"
                    onClick={() => setCounts((prev) => ({ ...prev, [denom]: (prev[denom] ?? 0) + 1 }))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="ml-1 w-3 text-[11px] text-muted">tờ</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted">
          {status === "saving" ? "Đang lưu phiên..." : status === "saved" ? "Đã lưu tự động." : "Tự lưu sau 15 giây."}
        </p>
      </div>
    </div>
  );
}
