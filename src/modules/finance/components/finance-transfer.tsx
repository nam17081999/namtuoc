"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { formatMoneyGroupedSpaces } from "@/core/utils/format-money";
import { computeAccountBalances } from "../balances";
import {
  useAccounts,
  useAdjustGoldHolding,
  useCreateAccount,
  useCreateTransaction,
  useGoldHolding,
  useGoldPrice,
  useTransactions
} from "../hooks";
import type { Account, AccountType } from "../types";

const SOURCE_OPTIONS = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Ngân hàng" },
  { value: "gold", label: "Vàng" }
] as const;

const QUICK_MONEY_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000];
const QUICK_GOLD_AMOUNTS = ["0.5", "1", "2", "5"];

function sourceLabel(type: AccountType) {
  if (type === "cash") return "tiền mặt";
  if (type === "bank") return "ngân hàng";
  return "vàng";
}

export function FinanceTransfer() {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: goldHolding } = useGoldHolding();
  const { data: goldQuote, isError: goldQuoteError } = useGoldPrice();
  const createTransaction = useCreateTransaction();
  const adjustGold = useAdjustGoldHolding();
  const createAccount = useCreateAccount();

  const [fromSource, setFromSource] = useState<AccountType>("cash");
  const [toSource, setToSource] = useState<AccountType>("bank");
  const [amountVnd, setAmountVnd] = useState(0);
  const [goldChi, setGoldChi] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const balances = useMemo(() => computeAccountBalances(accounts, transactions), [accounts, transactions]);
  const cashBalance = useMemo(
    () => accounts.filter((a) => a.type === "cash").reduce((sum, a) => sum + (balances[a.id] ?? 0), 0),
    [accounts, balances]
  );
  const bankBalance = useMemo(
    () => accounts.filter((a) => a.type === "bank").reduce((sum, a) => sum + (balances[a.id] ?? 0), 0),
    [accounts, balances]
  );

  const goldChiNum = Number.parseFloat(goldChi.replace(",", ".")) || 0;
  const vndPerChi = goldQuote?.vndPerChi;
  const currentGoldChi = goldHolding?.quantity_chi ?? 0;
  const involvesGold = fromSource === "gold" || toSource === "gold";
  const convertedVnd = vndPerChi && goldChiNum > 0 ? Math.round(goldChiNum * vndPerChi) : 0;

  const busy = createTransaction.isPending || createAccount.isPending || adjustGold.isPending;

  const resolveAccount = async (type: AccountType): Promise<Account> => {
    const found = accounts.find((a) => a.type === type);
    if (found) return found;

    return createAccount.mutateAsync({
      name: type === "cash" ? "Tiền mặt" : type === "bank" ? "Ngân hàng" : "Vàng",
      type
    });
  };

  const availableVndBySource = (source: AccountType) => {
    if (source === "cash") return cashBalance;
    if (source === "bank") return bankBalance;
    return vndPerChi ? currentGoldChi * vndPerChi : 0;
  };

  const handleSwap = () => {
    setFromSource(toSource);
    setToSource(fromSource);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (fromSource === toSource) {
      setError("Hãy chọn 2 nguồn khác nhau để chuyển đổi.");
      return;
    }

    const submitNote =
      note.trim() ||
      `Chuyển đổi từ ${sourceLabel(fromSource)} sang ${sourceLabel(toSource)}`;

    if (involvesGold) {
      if (!vndPerChi || goldQuoteError) {
        setError("Chưa có giá vàng VN, chưa thể quy đổi với vàng.");
        return;
      }
      if (goldChiNum <= 0) {
        setError("Nhập số chỉ vàng cần quy đổi.");
        return;
      }

      const vndAmount = Math.round(goldChiNum * vndPerChi);
      if (vndAmount <= 0) {
        setError("Giá trị quy đổi không hợp lệ.");
        return;
      }

      if (fromSource === "gold") {
        if (currentGoldChi + 1e-6 < goldChiNum) {
          setError("Không đủ số chỉ vàng để chuyển.");
          return;
        }

        try {
          const fromAcc = await resolveAccount("gold");
          const toAcc = await resolveAccount(toSource);

          await adjustGold.mutateAsync(-goldChiNum);
          try {
            await createTransaction.mutateAsync({
              type: "transfer",
              from_account: fromAcc.id,
              to_account: toAcc.id,
              amount: vndAmount,
              category: "Chuyển đổi",
              note: submitNote
            });
          } catch (txErr) {
            await adjustGold.mutateAsync(goldChiNum);
            throw txErr;
          }

          setGoldChi("");
          setNote("");
          setSuccess(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Không chuyển đổi được.");
        }
        return;
      }

      const sourceVnd = availableVndBySource(fromSource);
      if (sourceVnd + 1e-6 < vndAmount) {
        setError("Số dư không đủ để quy đổi sang vàng.");
        return;
      }

      try {
        const fromAcc = await resolveAccount(fromSource);
        const toAcc = await resolveAccount("gold");

        await adjustGold.mutateAsync(goldChiNum);
        try {
          await createTransaction.mutateAsync({
            type: "transfer",
            from_account: fromAcc.id,
            to_account: toAcc.id,
            amount: vndAmount,
            category: "Chuyển đổi",
            note: submitNote
          });
        } catch (txErr) {
          await adjustGold.mutateAsync(-goldChiNum);
          throw txErr;
        }

        setGoldChi("");
        setNote("");
        setSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không chuyển đổi được.");
      }
      return;
    }

    const vndAmount = Math.max(0, amountVnd);
    if (vndAmount <= 0) {
      setError("Nhập số tiền VND cần chuyển.");
      return;
    }

    const sourceVnd = availableVndBySource(fromSource);
    if (sourceVnd + 1e-6 < vndAmount) {
      setError("Số dư nguồn chuyển không đủ.");
      return;
    }

    try {
      const fromAcc = await resolveAccount(fromSource);
      const toAcc = await resolveAccount(toSource);

      await createTransaction.mutateAsync({
        type: "transfer",
        from_account: fromAcc.id,
        to_account: toAcc.id,
        amount: vndAmount,
        category: "Chuyển đổi",
        note: submitNote
      });

      setAmountVnd(0);
      setNote("");
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không chuyển đổi được.");
    }
  };

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
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Chuyển đổi</p>
          <h1 className="text-lg font-semibold text-text">Nguồn tiền</h1>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl bg-background/60 p-4 shadow-sm ring-1 ring-border/40">
        <label className="block text-[12px] text-muted">Từ nguồn</label>
        <Segmented
          options={SOURCE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
          value={fromSource}
          onChange={(value) => setFromSource(value as AccountType)}
          className="bg-card/80"
        />

        <div className="flex justify-center">
          <Button type="button" variant="ghost" className="rounded-full" onClick={handleSwap}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Đảo chiều
          </Button>
        </div>

        <label className="block text-[12px] text-muted">Sang nguồn</label>
        <Segmented
          options={SOURCE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
          value={toSource}
          onChange={(value) => setToSource(value as AccountType)}
          className="bg-card/80"
        />

        {involvesGold ? (
          <>
            <label className="block text-[12px] text-muted">Số vàng quy đổi (chỉ)</label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Ví dụ: 0.5 hoặc 1"
              value={goldChi}
              onChange={(event) => setGoldChi(event.target.value)}
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
                {convertedVnd > 0 ? `${formatMoneyGroupedSpaces(convertedVnd)} đ` : "—"}
              </span>
              <span className="mt-1 block text-[11px]">
                Giá tham chiếu: {vndPerChi ? `${formatMoneyGroupedSpaces(Math.round(vndPerChi))} đ/chi` : "chưa có"}
              </span>
            </p>
          </>
        ) : (
          <>
            <label className="block text-[12px] text-muted">Số tiền chuyển (VNĐ)</label>
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

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-card/40 p-2 text-[11px] text-muted">
          <div className="rounded-xl bg-card/70 px-2 py-2">
            <p>Tiền mặt</p>
            <p className="font-medium text-text">{formatMoneyGroupedSpaces(Math.round(cashBalance))} đ</p>
          </div>
          <div className="rounded-xl bg-card/70 px-2 py-2">
            <p>Ngân hàng</p>
            <p className="font-medium text-text">{formatMoneyGroupedSpaces(Math.round(bankBalance))} đ</p>
          </div>
          <div className="rounded-xl bg-card/70 px-2 py-2">
            <p>Vàng</p>
            <p className="font-medium text-text">
              {currentGoldChi.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} chỉ
            </p>
          </div>
        </div>

        <label className="block text-[12px] text-muted">Ghi chú (tùy chọn)</label>
        <Input placeholder="Ví dụ: chuyển tiền mua vàng" value={note} onChange={(e) => setNote(e.target.value)} />

        {error ? <p className="text-[12px] text-red-400">{error}</p> : null}
        {success ? <p className="text-[12px] text-emerald-400">Đã chuyển đổi thành công.</p> : null}

        <Button
          className="w-full rounded-full bg-amber-500 text-[#0c0f18]"
          disabled={busy}
          onClick={() => void handleSubmit()}
        >
          {busy ? "Đang xử lý..." : "Thực hiện chuyển đổi"}
        </Button>
      </div>
    </div>
  );
}


