"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { formatMoneyGroupedSpaces } from "@/core/utils/format-money";
import { EXPENSE_PURPOSES, EXPENSE_SOURCES, type ExpensePurposeValue, type ExpenseSourceValue } from "../constants";
import {
  useAccounts,
  useAdjustGoldHolding,
  useCreateAccount,
  useCreateTransaction,
  useGoldHolding,
  useGoldPrice
} from "../hooks";
import type { Account } from "../types";

const QUICK_MONEY_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];
const QUICK_EXPENSE_PURPOSES: ExpensePurposeValue[] = ["food", "transport", "bills", "other"];

export function FinanceExpense() {
  const { data: accounts = [] } = useAccounts();
  const { data: goldHolding } = useGoldHolding();
  const { data: goldQuote, isError: goldQuoteError } = useGoldPrice();
  const createTransaction = useCreateTransaction();
  const adjustGold = useAdjustGoldHolding();
  const createAccount = useCreateAccount();

  const [purpose, setPurpose] = useState<ExpensePurposeValue>("food");
  const [source, setSource] = useState<ExpenseSourceValue>("cash");
  const [amountVnd, setAmountVnd] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categoryLabel = EXPENSE_PURPOSES.find((p) => p.value === purpose)?.label ?? purpose;
  const quickPurposeOptions = useMemo(
    () => EXPENSE_PURPOSES.filter((item) => QUICK_EXPENSE_PURPOSES.includes(item.value)),
    []
  );
  const sourceOptions = useMemo(
    () =>
      EXPENSE_SOURCES.map((item) => ({
        value: item.value,
        label: item.value === "cash" ? "Tiền mặt" : item.value === "bank" ? "Ngân hàng" : "Vàng"
      })),
    []
  );

  const vndNum = Math.max(0, amountVnd);
  const vndPerChi = goldQuote?.vndPerChi;
  const chiFromVnd = vndPerChi && !goldQuoteError && vndNum > 0 ? vndNum / vndPerChi : 0;

  const resolveLedger = async (type: "cash" | "bank"): Promise<Account> => {
    const found = accounts.find((a) => a.type === type);
    if (found) return found;
    return createAccount.mutateAsync({
      name: type === "cash" ? "Tiền mặt" : "Ngân hàng",
      type
    });
  };

  const ensureGoldAccount = async (): Promise<Account> => {
    const existing = accounts.find((a) => a.type === "gold");
    if (existing) return existing;
    return createAccount.mutateAsync({ name: "Vàng", type: "gold" });
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (vndNum <= 0) {
      setError("Nhập số tiền chi (VND).");
      return;
    }

    if (source === "gold") {
      if (!vndPerChi || goldQuoteError) {
        setError("Chưa có giá vàng VN, không thể chi từ vàng.");
        return;
      }
      const deltaChi = -chiFromVnd;
      const current = goldHolding?.quantity_chi ?? 0;
      if (current + deltaChi < -1e-6) {
        setError(
          `Không đủ vàng. Hiện có ${current.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} chỉ, cần ${chiFromVnd.toLocaleString("vi-VN", { maximumFractionDigits: 4 })} chỉ.`
        );
        return;
      }
      try {
        const goldAcc = await ensureGoldAccount();
        await adjustGold.mutateAsync(deltaChi);
        try {
          await createTransaction.mutateAsync({
            type: "expense",
            from_account: goldAcc.id,
            to_account: null,
            amount: vndNum,
            category: categoryLabel,
            note: note.trim() || `-${chiFromVnd.toFixed(4)} chỉ @ giá hiện tại`
          });
        } catch (txErr) {
          await adjustGold.mutateAsync(-deltaChi);
          throw txErr;
        }
        setAmountVnd(0);
        setNote("");
        setSuccess(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Không thể lưu.";
        if ((e as Error & { code?: string }).code === "INSUFFICIENT_GOLD") {
          setError("Không đủ số chỉ vàng.");
        } else {
          setError(msg);
        }
      }
      return;
    }

    try {
      const acc = await resolveLedger(source);
      await createTransaction.mutateAsync({
        type: "expense",
        from_account: acc.id,
        to_account: null,
        amount: vndNum,
        category: categoryLabel,
        note: note.trim() || null
      });
      setAmountVnd(0);
      setNote("");
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được.");
    }
  };

  const busy = createTransaction.isPending || createAccount.isPending || adjustGold.isPending;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-10 pt-4 sm:px-5">
      <div className="flex items-center gap-2">
        <Link
          href="/apps/finance"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 ring-1 ring-border/40"
          aria-label="Quay lại"
        >
          <ChevronLeft className="h-5 w-5 text-text" />
        </Link>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Chi tiêu</p>
          <h1 className="text-lg font-semibold text-text">Tiền chi</h1>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl bg-background/60 p-4 shadow-sm ring-1 ring-border/40">
        <label className="block text-[12px] text-muted">Nguồn tiền</label>
        <Segmented
          options={sourceOptions}
          value={source}
          onChange={(value) => setSource(value as ExpenseSourceValue)}
          className="bg-card/80"
        />

        <label className="block text-[12px] text-muted">Số tiền (VNĐ)</label>
        <MoneyInput value={amountVnd} onValueChange={setAmountVnd} placeholder="0" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {QUICK_MONEY_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmountVnd(value)}
              className="rounded-xl bg-card/70 px-2 py-1.5 text-xs text-text ring-1 ring-border/50"
            >
              {formatMoneyGroupedSpaces(value)}
            </button>
          ))}
        </div>

        <label className="block text-[12px] text-muted">Mục đích nhanh</label>
        <div className="grid grid-cols-2 gap-2">
          {quickPurposeOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPurpose(item.value)}
              className={`rounded-2xl px-3 py-2 text-left text-[12px] font-medium transition ${
                purpose === item.value
                  ? "bg-amber-500 text-[#0c0f18]"
                  : "bg-card/70 text-text ring-1 ring-border/50 hover:bg-card"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="block text-[12px] text-muted">Mục đích đầy đủ</label>
        <Select value={purpose} onChange={(e) => setPurpose(e.target.value as ExpensePurposeValue)}>
          {EXPENSE_PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>

        {source === "gold" ? (
          <p className="text-[12px] text-muted">
            Trừ kho vàng:{" "}
            <span className="font-medium text-text">
              {chiFromVnd > 0 ? `${chiFromVnd.toLocaleString("vi-VN", { maximumFractionDigits: 4 })} chỉ` : "—"}
            </span>
            <span className="mt-1 block text-[11px]">
              Đang có: {(goldHolding?.quantity_chi ?? 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} chỉ
              {vndPerChi ? ` · giá ~${formatMoneyGroupedSpaces(Math.round(vndPerChi))} đ/chi` : ""}
            </span>
          </p>
        ) : null}

        <label className="block text-[12px] text-muted">Ghi chú (tùy chọn)</label>
        <Input placeholder="Ghi chú ngắn" value={note} onChange={(e) => setNote(e.target.value)} />

        {error ? <p className="text-[12px] text-red-400">{error}</p> : null}
        {success ? <p className="text-[12px] text-emerald-400">Đã lưu khoản chi.</p> : null}

        <Button
          className="w-full rounded-full bg-amber-500 text-[#0c0f18]"
          disabled={busy}
          onClick={() => void handleSubmit()}
        >
          {busy ? "Đang lưu..." : "Lưu tiền chi"}
        </Button>
      </div>
    </div>
  );
}



