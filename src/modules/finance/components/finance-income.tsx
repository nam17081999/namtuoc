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
import { INCOME_TYPES, STORAGE_TYPES, type IncomeTypeValue, type StorageTypeValue } from "../constants";
import {
  useAccounts,
  useAdjustGoldHolding,
  useCreateAccount,
  useCreateTransaction,
  useGoldPrice
} from "../hooks";
import type { Account } from "../types";

const QUICK_MONEY_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000];
const QUICK_GOLD_AMOUNTS = ["0.5", "1", "2", "5"];
const QUICK_INCOME_TYPES: IncomeTypeValue[] = ["salary", "bonus", "side_income", "other"];

export function FinanceIncome() {
  const { data: accounts = [] } = useAccounts();
  const { data: goldQuote, isError: goldQuoteError } = useGoldPrice();
  const createTransaction = useCreateTransaction();
  const adjustGold = useAdjustGoldHolding();
  const createAccount = useCreateAccount();

  const [incomeType, setIncomeType] = useState<IncomeTypeValue>("salary");
  const [storage, setStorage] = useState<StorageTypeValue>("cash");
  const [amountVnd, setAmountVnd] = useState(0);
  const [goldChi, setGoldChi] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categoryLabel = INCOME_TYPES.find((t) => t.value === incomeType)?.label ?? incomeType;
  const quickIncomeTypeOptions = useMemo(
    () => INCOME_TYPES.filter((item) => QUICK_INCOME_TYPES.includes(item.value)),
    []
  );
  const storageOptions = useMemo(
    () =>
      STORAGE_TYPES.map((item) => ({
        value: item.value,
        label: item.value === "cash" ? "Tiền mặt" : item.value === "bank" ? "Ngân hàng" : "Vàng"
      })),
    []
  );

  const goldChiNum = Number.parseFloat(goldChi.replace(",", ".")) || 0;
  const vndPerChi = goldQuote?.vndPerChi;
  const estimatedVnd = vndPerChi && goldChiNum > 0 ? goldChiNum * vndPerChi : 0;

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

    if (storage === "gold") {
      if (!vndPerChi || goldQuoteError) {
        setError("Chưa có giá vàng VN, không thể ghi nhận thu vàng.");
        return;
      }
      if (goldChiNum <= 0) {
        setError("Nhập số chỉ vàng.");
        return;
      }
      try {
        const goldAcc = await ensureGoldAccount();
        await adjustGold.mutateAsync(goldChiNum);
        const vnd = Math.round(goldChiNum * vndPerChi);
        try {
          await createTransaction.mutateAsync({
            type: "income",
            from_account: null,
            to_account: goldAcc.id,
            amount: vnd,
            category: categoryLabel,
            note: note.trim() || `+${goldChiNum} chỉ @ ${formatMoneyGroupedSpaces(Math.round(vndPerChi))} đ/chi`
          });
        } catch (txErr) {
          await adjustGold.mutateAsync(-goldChiNum);
          throw txErr;
        }
        setGoldChi("");
        setNote("");
        setSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không lưu được.");
      }
      return;
    }

    const vnd = Math.max(0, amountVnd);
    if (vnd <= 0) {
      setError("Nhập số tiền VND.");
      return;
    }

    try {
      const acc = await resolveLedger(storage);
      await createTransaction.mutateAsync({
        type: "income",
        from_account: null,
        to_account: acc.id,
        amount: vnd,
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
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Thu nhập</p>
          <h1 className="text-lg font-semibold text-text">Tiền thu</h1>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl bg-background/60 p-4 shadow-sm ring-1 ring-border/40">
        <label className="block text-[12px] text-muted">Nguồn tiền</label>
        <Segmented
          options={storageOptions}
          value={storage}
          onChange={(value) => setStorage(value as StorageTypeValue)}
          className="bg-card/80"
        />

        <label className="block text-[12px] text-muted">Loại thu nhanh</label>
        <div className="grid grid-cols-2 gap-2">
          {quickIncomeTypeOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setIncomeType(item.value)}
              className={`rounded-2xl px-3 py-2 text-left text-[12px] font-medium transition ${
                incomeType === item.value
                  ? "bg-amber-500 text-[#0c0f18]"
                  : "bg-card/70 text-text ring-1 ring-border/50 hover:bg-card"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="block text-[12px] text-muted">Loại thu đầy đủ</label>
        <Select value={incomeType} onChange={(e) => setIncomeType(e.target.value as IncomeTypeValue)}>
          {INCOME_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        {storage === "gold" ? (
          <>
            <label className="block text-[12px] text-muted">Số vàng (chỉ)</label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Ví dụ: 1 hoặc 0.5"
              value={goldChi}
              onChange={(e) => setGoldChi(e.target.value)}
            />
            <div className="grid grid-cols-4 gap-2">
              {QUICK_GOLD_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoldChi(value)}
                  className="rounded-xl bg-card/70 px-2 py-1.5 text-xs text-text ring-1 ring-border/50"
                >
                  {value} chỉ
                </button>
              ))}
            </div>
            <p className="text-[12px] text-muted">
              Quy đổi:{" "}
              <span className="font-medium text-text">
                {estimatedVnd > 0 ? `${formatMoneyGroupedSpaces(Math.round(estimatedVnd))} đ` : "—"}
              </span>
            </p>
          </>
        ) : (
          <>
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
          </>
        )}

        <label className="block text-[12px] text-muted">Ghi chú (tùy chọn)</label>
        <Input placeholder="Ghi chú ngắn" value={note} onChange={(e) => setNote(e.target.value)} />

        {error ? <p className="text-[12px] text-red-400">{error}</p> : null}
        {success ? <p className="text-[12px] text-emerald-400">Đã lưu khoản thu.</p> : null}

        <Button
          className="w-full rounded-full bg-amber-500 text-[#0c0f18]"
          disabled={busy}
          onClick={() => void handleSubmit()}
        >
          {busy ? "Đang lưu..." : "Lưu tiền thu"}
        </Button>
      </div>
    </div>
  );
}


