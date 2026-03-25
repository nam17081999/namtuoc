"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MONEY_DENOMINATIONS } from "@/core/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { useCreateMoneySession, useMoneySessions, useUpsertMoneyItems } from "../hooks";
import type { MoneyItem } from "../types";

const INACTIVITY_MS = 5 * 60 * 1000;
const COUNTS_STORAGE_KEY = "money-counter-draft-counts";
const META_STORAGE_KEY = "money-counter-draft-meta";

type DraftMeta = {
  lastActivityAt: number | null;
};

const DEFAULT_META: DraftMeta = {
  lastActivityAt: null
};

function formatHistoryTotal(items: MoneyItem[] | undefined) {
  const total = (items ?? []).reduce((sum, item) => sum + item.denomination * item.quantity, 0);
  return total.toLocaleString("vi-VN");
}

function formatHistoryBreakdown(items: MoneyItem[] | undefined) {
  return (items ?? [])
    .filter((item) => item.quantity > 0)
    .sort((a, b) => b.denomination - a.denomination)
    .map((item) => `${item.denomination.toLocaleString("vi-VN")}đ x ${item.quantity}`)
    .join(" · ");
}

export function MoneyCounterShell() {
  const { data: sessions = [] } = useMoneySessions();
  const createSession = useCreateMoneySession();
  const upsertItems = useUpsertMoneyItems();

  const [counts, setCounts] = useLocalStorageState<Record<number, number>>(COUNTS_STORAGE_KEY, {});
  const [draftMeta, setDraftMeta] = useLocalStorageState<DraftMeta>(META_STORAGE_KEY, DEFAULT_META);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const commitLockRef = useRef(false);

  const sortedDenoms = useMemo(() => [...MONEY_DENOMINATIONS].sort((a, b) => b - a), []);

  const total = useMemo(() => {
    return MONEY_DENOMINATIONS.reduce((sum, denom) => {
      const qty = counts[denom] ?? 0;
      return sum + denom * qty;
    }, 0);
  }, [counts]);

  const hasAnyCount = useMemo(
    () => MONEY_DENOMINATIONS.some((denom) => (counts[denom] ?? 0) > 0),
    [counts]
  );

  const resetDraft = () => {
    setCounts({});
    setDraftMeta(DEFAULT_META);
    setStatus("idle");
  };

  const markActivity = () => {
    setDraftMeta({
      lastActivityAt: Date.now()
    });
    setStatus("idle");
  };

  const saveHistoryAndReset = async () => {
    if (commitLockRef.current || !hasAnyCount) return;

    commitLockRef.current = true;
    setStatus("saving");

    try {
      const session = await createSession.mutateAsync();
      const payload = MONEY_DENOMINATIONS.map((denom) => ({
        denomination: denom,
        quantity: counts[denom] ?? 0
      }));

      await upsertItems.mutateAsync({ sessionId: session.id, items: payload });
      resetDraft();
      setStatus("saved");
    } finally {
      commitLockRef.current = false;
    }
  };

  const commitIfInactive = async () => {
    if (!hasAnyCount || !draftMeta.lastActivityAt) return;
    if (Date.now() - draftMeta.lastActivityAt < INACTIVITY_MS) return;
    await saveHistoryAndReset();
  };

  useEffect(() => {
    if (!hasAnyCount || !draftMeta.lastActivityAt) return;

    const timeout = draftMeta.lastActivityAt + INACTIVITY_MS - Date.now();
    if (timeout <= 0) {
      void commitIfInactive();
      return;
    }

    const handle = window.setTimeout(() => {
      void commitIfInactive();
    }, timeout);

    return () => window.clearTimeout(handle);
  }, [hasAnyCount, draftMeta.lastActivityAt, counts]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void commitIfInactive();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasAnyCount, draftMeta.lastActivityAt, counts]);

  const handleChange = (denom: number, value: string) => {
    const qty = Math.max(0, Number.parseInt(value || "0", 10));
    setCounts((prev) => ({ ...prev, [denom]: Number.isNaN(qty) ? 0 : qty }));
    markActivity();
  };

  const changeCountByStep = (denom: number, step: number) => {
    setCounts((prev) => ({
      ...prev,
      [denom]: Math.max(0, (prev[denom] ?? 0) + step)
    }));
    markActivity();
  };

  const handleReset = () => {
    resetDraft();
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-3xl bg-background/60 p-4 shadow-sm ring-1 ring-border/40">
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
            className="rounded-full bg-card/60 px-3 text-[11px] text-muted hover:text-text"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full px-4 text-xs font-medium shadow-sm"
            onClick={() => void saveHistoryAndReset()}
            disabled={!hasAnyCount || status === "saving"}
          >
            Lưu lịch sử
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
                  onClick={() => changeCountByStep(denom, -1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="h-8 w-16 rounded-2xl border-border/80 bg-background px-1 text-center text-sm font-medium"
                  value={counts[denom] ?? ""}
                  onChange={(event) => handleChange(denom, event.target.value)}
                  placeholder="0"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 rounded-full px-0 text-muted hover:bg-card hover:text-text"
                  onClick={() => changeCountByStep(denom, 1)}
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
        {status === "saving"
          ? "Đang lưu lịch sử..."
          : status === "saved"
            ? "Đã lưu lịch sử và reset."
            : "Sau 5 phút không thay đổi, app sẽ tự lưu lịch sử và reset."}
      </p>

      <div className="flex w-full flex-col gap-3 rounded-2xl bg-card/70 p-3 ring-1 ring-border/40">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Lịch sử đã lưu</p>
        </div>
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-[12px] text-muted">Chưa có lịch sử nào.</p>
          ) : (
            sessions.map((session) => {
              const breakdown = formatHistoryBreakdown(session.money_items);

              return (
                <div key={session.id} className="rounded-xl bg-background/80 px-3 py-2 text-[12px] text-text">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      {new Date(session.updated_at).toLocaleDateString("vi-VN")}{" "}
                      {new Date(session.updated_at).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    <span className="font-medium">{formatHistoryTotal(session.money_items)} đ</span>
                  </div>
                  {breakdown ? <p className="mt-1 text-[11px] text-muted">{breakdown}</p> : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
