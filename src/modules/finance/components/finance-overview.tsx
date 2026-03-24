"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ArrowLeftRight, BarChart3, ChevronRight, Target } from "lucide-react";
import { formatMoneyGroupedSpaces } from "@/core/utils/format-money";
import {
  useAccounts,
  useEnsureDefaultCashBank,
  useGoldHolding,
  useGoldPrice,
  useTransactions
} from "../hooks";
import { computeAccountBalances } from "../balances";

export function FinanceOverview() {
  const { data: accounts = [], isFetched: accountsFetched } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: goldHolding } = useGoldHolding();
  const { data: goldQuote, isError: goldQuoteError } = useGoldPrice();
  const { mutate: ensureCashBank } = useEnsureDefaultCashBank();
  const ensuredDefaultsRef = useRef(false);

  const missingDefaultAccounts = useMemo(() => {
    const hasCash = accounts.some((a) => a.type === "cash");
    const hasBank = accounts.some((a) => a.type === "bank");
    const hasGold = accounts.some((a) => a.type === "gold");
    return !hasCash || !hasBank || !hasGold;
  }, [accounts]);

  useEffect(() => {
    if (!accountsFetched || ensuredDefaultsRef.current || !missingDefaultAccounts) {
      return;
    }

    ensuredDefaultsRef.current = true;
    ensureCashBank(accounts);
  }, [accountsFetched, missingDefaultAccounts, ensureCashBank, accounts]);

  const balances = useMemo(() => computeAccountBalances(accounts, transactions), [accounts, transactions]);

  const cashTotal = useMemo(
    () => accounts.filter((a) => a.type === "cash").reduce((sum, a) => sum + (balances[a.id] ?? 0), 0),
    [accounts, balances]
  );
  const bankTotal = useMemo(
    () => accounts.filter((a) => a.type === "bank").reduce((sum, a) => sum + (balances[a.id] ?? 0), 0),
    [accounts, balances]
  );

  const goldChi = goldHolding?.quantity_chi ?? 0;
  const vndPerChi = goldQuote?.vndPerChi;
  const goldValue = vndPerChi ? goldChi * vndPerChi : 0;
  const totalAsset = cashTotal + bankTotal + goldValue;
  const recent = transactions.slice(0, 6);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-10 pt-4 sm:px-5">
      <div className="rounded-3xl bg-background/60 p-4 shadow-sm ring-1 ring-border/40">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Tổng tài sản</p>
        <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-text">
          {formatMoneyGroupedSpaces(Math.round(totalAsset))} đ
        </p>
        <p className="mt-2 text-[11px] text-muted">Tiền mặt + Ngân hàng + Vàng quy đổi theo giá hiện tại.</p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-3">
          <div className="rounded-2xl bg-card/70 px-3 py-2 ring-1 ring-border/40">
            <p className="text-muted">Tiền mặt</p>
            <p className="font-medium text-text">{formatMoneyGroupedSpaces(Math.round(cashTotal))} đ</p>
          </div>
          <div className="rounded-2xl bg-card/70 px-3 py-2 ring-1 ring-border/40">
            <p className="text-muted">Ngân hàng</p>
            <p className="font-medium text-text">{formatMoneyGroupedSpaces(Math.round(bankTotal))} đ</p>
          </div>
          <div className="col-span-2 rounded-2xl bg-card/70 px-3 py-2 ring-1 ring-border/40 sm:col-span-1">
            <p className="text-muted">Vàng</p>
            <p className="font-medium text-text">
              {goldChi.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} chỉ
            </p>
            <p className="text-[11px] text-muted">≈ {formatMoneyGroupedSpaces(Math.round(goldValue))} đ</p>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-muted">
          Giá vàng ({goldQuote?.name ?? "SJC"}):{" "}
          {goldQuoteError
            ? "không tải được"
            : goldQuote && vndPerChi
              ? `${formatMoneyGroupedSpaces(Math.round(vndPerChi))} đ/chi`
              : "đang tải..."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/apps/finance/ke-hoach"
          className="flex items-center justify-between rounded-3xl bg-card/80 px-4 py-4 text-left shadow-sm ring-1 ring-border/40 transition active:scale-[0.99]"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Kế hoạch</p>
            <p className="text-base font-semibold text-text">Budget & mục tiêu</p>
            <p className="mt-0.5 text-[11px] text-muted">Định kỳ, dự báo</p>
          </div>
          <Target className="h-5 w-5 text-muted" />
        </Link>
        <Link
          href="/apps/finance/thu"
          className="flex items-center justify-between rounded-3xl bg-card/80 px-4 py-4 text-left shadow-sm ring-1 ring-border/40 transition active:scale-[0.99]"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Thu</p>
            <p className="text-base font-semibold text-text">Tiền thu</p>
            <p className="mt-0.5 text-[11px] text-muted">Thu nhanh</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>

        <Link
          href="/apps/finance/chi"
          className="flex items-center justify-between rounded-3xl bg-card/80 px-4 py-4 text-left shadow-sm ring-1 ring-border/40 transition active:scale-[0.99]"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Chi</p>
            <p className="text-base font-semibold text-text">Tiền chi</p>
            <p className="mt-0.5 text-[11px] text-muted">Ghi nhận chi tiêu</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>

        <Link
          href="/apps/finance/chuyen-doi"
          className="flex items-center justify-between rounded-3xl bg-card/80 px-4 py-4 text-left shadow-sm ring-1 ring-border/40 transition active:scale-[0.99]"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Chuyển đổi</p>
            <p className="text-base font-semibold text-text">Nguồn tiền</p>
            <p className="mt-0.5 text-[11px] text-muted">Tiền mặt, ngân hàng, vàng</p>
          </div>
          <ArrowLeftRight className="h-5 w-5 text-muted" />
        </Link>

        <Link
          href="/apps/finance/thong-ke"
          className="flex items-center justify-between rounded-3xl bg-card/80 px-4 py-4 text-left shadow-sm ring-1 ring-border/40 transition active:scale-[0.99]"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Thống kê</p>
            <p className="text-base font-semibold text-text">Tuần / tháng</p>
            <p className="mt-0.5 text-[11px] text-muted">Tổng quan thu chi</p>
          </div>
          <BarChart3 className="h-5 w-5 text-muted" />
        </Link>
      </div>

      <div className="rounded-3xl bg-background/40 p-4 ring-1 ring-border/30">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Giao dịch gần đây</p>
        {recent.length === 0 ? (
          <p className="text-[13px] text-muted">Chưa có giao dịch.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between rounded-2xl bg-card/60 px-3 py-2 text-[13px] ring-1 ring-border/30"
              >
                <span className="truncate pr-2 text-text">
                  {tx.type === "income" ? "Thu" : tx.type === "expense" ? "Chi" : "Chuyển"}{" "}
                  {tx.category ? `· ${tx.category}` : ""}
                </span>
                <span className="shrink-0 text-muted">
                  {formatMoneyGroupedSpaces(Math.round(Number(tx.amount)))} đ
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

