"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { formatMoneyGroupedSpaces } from "@/core/utils/format-money";
import { useAccounts, useTransactions } from "../hooks";
import type { AccountType, Transaction } from "../types";

type PeriodKey = "week" | "month";

type Totals = {
  income: number;
  expense: number;
  transfer: number;
  net: number;
};

type SourceFlow = {
  in: number;
  out: number;
  net: number;
};

type Range = {
  start: Date;
  end: Date;
  label: string;
};

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = (day + 6) % 7;
  next.setDate(next.getDate() - diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatDateRange(start: Date, endExclusive: Date) {
  const end = addDays(endExclusive, -1);
  const left = start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  const right = end.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  return `${left} - ${right}`;
}

function getRange(period: PeriodKey, offset: number): Range {
  const now = new Date();

  if (period === "week") {
    const currentStart = startOfWeek(now);
    const start = addDays(currentStart, offset * 7);
    const end = addDays(start, 7);
    return {
      start,
      end,
      label: `Tuần ${formatDateRange(start, end)}`
    };
  }

  const currentStart = startOfMonth(now);
  const start = addMonths(currentStart, offset);
  const end = addMonths(start, 1);
  return {
    start,
    end,
    label: `Tháng ${start.toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })}`
  };
}

function isWithinRange(dateIso: string, range: Range) {
  const time = new Date(dateIso).getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
}

function calcTotals(list: Transaction[]): Totals {
  const income = list.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expense = list.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const transfer = list.filter((tx) => tx.type === "transfer").reduce((sum, tx) => sum + Number(tx.amount), 0);

  return {
    income,
    expense,
    transfer,
    net: income - expense
  };
}

function calcChange(current: number, previous: number) {
  const delta = current - previous;
  if (previous === 0) {
    if (current === 0) return { delta, percent: 0 };
    return { delta, percent: null as number | null };
  }
  return {
    delta,
    percent: (delta / Math.abs(previous)) * 100
  };
}

function groupByCategory(transactions: Transaction[]) {
  const map = new Map<string, number>();
  transactions.forEach((tx) => {
    const key = tx.category ?? "Khác";
    map.set(key, (map.get(key) ?? 0) + Number(tx.amount));
  });

  return Array.from(map.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function shortDayLabel(date: Date) {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatCompactMoney(value: number) {
  return `${formatMoneyGroupedSpaces(Math.round(Math.abs(value)))} đ`;
}

function sourceTitle(source: AccountType) {
  if (source === "cash") return "Tiền mặt";
  if (source === "bank") return "Ngân hàng";
  return "Vàng";
}

function buildSourceFlow(
  transactions: Transaction[],
  accountTypeById: Map<string, AccountType>
): Record<AccountType, SourceFlow> {
  const flow: Record<AccountType, SourceFlow> = {
    cash: { in: 0, out: 0, net: 0 },
    bank: { in: 0, out: 0, net: 0 },
    gold: { in: 0, out: 0, net: 0 }
  };

  const pushIn = (accountId: string | null, amount: number) => {
    if (!accountId) return;
    const accountType = accountTypeById.get(accountId);
    if (!accountType) return;
    flow[accountType].in += amount;
    flow[accountType].net += amount;
  };

  const pushOut = (accountId: string | null, amount: number) => {
    if (!accountId) return;
    const accountType = accountTypeById.get(accountId);
    if (!accountType) return;
    flow[accountType].out += amount;
    flow[accountType].net -= amount;
  };

  transactions.forEach((tx) => {
    const amount = Number(tx.amount);
    if (tx.type === "income") {
      pushIn(tx.to_account, amount);
      return;
    }
    if (tx.type === "expense") {
      pushOut(tx.from_account, amount);
      return;
    }
    if (tx.type === "transfer") {
      pushOut(tx.from_account, amount);
      pushIn(tx.to_account, amount);
    }
  });

  return flow;
}

function buildDailyBuckets(transactions: Transaction[], range: Range, period: PeriodKey) {
  const length =
    period === "week"
      ? 7
      : Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)));

  const buckets = Array.from({ length }, (_, index) => {
    const date = addDays(range.start, index);
    return {
      index,
      date,
      label: shortDayLabel(date),
      income: 0,
      expense: 0,
      net: 0
    };
  });

  transactions.forEach((tx) => {
    const date = new Date(tx.created_at);
    const diff = Math.floor((date.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0 || diff >= buckets.length) return;
    const amount = Number(tx.amount);

    if (tx.type === "income") {
      buckets[diff].income += amount;
      buckets[diff].net += amount;
      return;
    }
    if (tx.type === "expense") {
      buckets[diff].expense += amount;
      buckets[diff].net -= amount;
    }
  });

  const maxValue = buckets.reduce((max, item) => Math.max(max, item.income, item.expense, Math.abs(item.net)), 0);

  const filteredBuckets = buckets.filter((item) => item.income > 0 || item.expense > 0);

  return { buckets: filteredBuckets, maxValue };
}

export function FinanceStats() {
  const { data: transactions = [] } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [offset, setOffset] = useState(0);

  const handleDateChange = (dateStr: string) => {
    if (!dateStr) return;
    const date = new Date(dateStr);
    const now = new Date();

    if (period === "week") {
      const startSelected = startOfWeek(date);
      const startCurrent = startOfWeek(now);
      const diffMs = startSelected.getTime() - startCurrent.getTime();
      const newOffset = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
      setOffset(newOffset);
    } else {
      const diffMonths = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
      setOffset(diffMonths);
    }
  };

  const currentRange = useMemo(() => getRange(period, offset), [period, offset]);
  const previousRange = useMemo(() => getRange(period, offset - 1), [period, offset]);

  const filteredCurrent = useMemo(
    () => transactions.filter((tx) => isWithinRange(tx.created_at, currentRange)),
    [transactions, currentRange]
  );
  const filteredPrevious = useMemo(
    () => transactions.filter((tx) => isWithinRange(tx.created_at, previousRange)),
    [transactions, previousRange]
  );

  const totalsCurrent = useMemo(() => calcTotals(filteredCurrent), [filteredCurrent]);
  const totalsPrevious = useMemo(() => calcTotals(filteredPrevious), [filteredPrevious]);

  const incomeChange = useMemo(
    () => calcChange(totalsCurrent.income, totalsPrevious.income),
    [totalsCurrent.income, totalsPrevious.income]
  );
  const expenseChange = useMemo(
    () => calcChange(totalsCurrent.expense, totalsPrevious.expense),
    [totalsCurrent.expense, totalsPrevious.expense]
  );
  const netChange = useMemo(
    () => calcChange(totalsCurrent.net, totalsPrevious.net),
    [totalsCurrent.net, totalsPrevious.net]
  );

  const expenseCategories = useMemo(
    () => groupByCategory(filteredCurrent.filter((tx) => tx.type === "expense")),
    [filteredCurrent]
  );
  const incomeCategories = useMemo(
    () => groupByCategory(filteredCurrent.filter((tx) => tx.type === "income")),
    [filteredCurrent]
  );

  const daily = useMemo(() => buildDailyBuckets(filteredCurrent, currentRange, period), [filteredCurrent, currentRange, period]);

  const accountTypeById = useMemo(() => {
    const map = new Map<string, AccountType>();
    accounts.forEach((account) => map.set(account.id, account.type));
    return map;
  }, [accounts]);
  const sourceFlow = useMemo(
    () => buildSourceFlow(filteredCurrent, accountTypeById),
    [filteredCurrent, accountTypeById]
  );

  const recent = useMemo(() => filteredCurrent.slice(0, 12), [filteredCurrent]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-10 pt-4 sm:px-5">
      <div className="flex items-center gap-2">
        <Link
          href="/apps/finance"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 ring-1 ring-border/40"
          aria-label="Quay lại"
        >
          <ChevronLeft className="h-5 w-5 text-text" />
        </Link>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Thống kê</p>
          <h1 className="text-lg font-semibold text-text">Thu chi nâng cao</h1>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl bg-background/60 p-4 shadow-sm ring-1 ring-border/40">
        <div className="flex items-center justify-between gap-2">
          <Segmented
            options={[
              { value: "week", label: "Tuần" },
              { value: "month", label: "Tháng" }
            ]}
            value={period}
            onChange={(value) => {
              setPeriod(value as PeriodKey);
              setOffset(0);
            }}
            className="max-w-[260px] bg-card/80"
          />
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setOffset((prev) => prev - 1)}>
              Trước
            </Button>
            <div className="relative flex items-center justify-center">
              <input
                type={period === "month" ? "month" : "date"}
                className="absolute inset-0 z-10 w-full h-full cursor-pointer opacity-0"
                onChange={(e) => handleDateChange(e.target.value)}
              />
              <Button size="sm" variant="ghost" className="pointer-events-none h-8 w-8 px-0 rounded-full text-muted">
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" disabled={offset >= 0} onClick={() => setOffset((prev) => prev + 1)}>
              Sau
            </Button>
          </div>
        </div>
        <p className="text-[12px] text-muted">
          {currentRange.label} · so sánh với {previousRange.label}
        </p>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-emerald-500/10 px-3 py-3 ring-1 ring-emerald-400/20">
            <p className="text-[11px] text-muted">Tổng thu</p>
            <p className="text-sm font-semibold text-emerald-300">{formatCompactMoney(totalsCurrent.income)}</p>
            <p className="text-[11px] text-muted">
              {incomeChange.percent === null ? "Mới" : `${incomeChange.percent >= 0 ? "+" : ""}${incomeChange.percent.toFixed(1)}%`}
            </p>
          </div>
          <div className="rounded-2xl bg-red-500/10 px-3 py-3 ring-1 ring-red-400/20">
            <p className="text-[11px] text-muted">Tổng chi</p>
            <p className="text-sm font-semibold text-red-300">{formatCompactMoney(totalsCurrent.expense)}</p>
            <p className="text-[11px] text-muted">
              {expenseChange.percent === null ? "Mới" : `${expenseChange.percent >= 0 ? "+" : ""}${expenseChange.percent.toFixed(1)}%`}
            </p>
          </div>
          <div className="rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/50">
            <p className="text-[11px] text-muted">Ròng</p>
            <p className={`text-sm font-semibold ${totalsCurrent.net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {totalsCurrent.net >= 0 ? "+" : "-"}
              {formatCompactMoney(totalsCurrent.net)}
            </p>
            <p className="text-[11px] text-muted">
              {netChange.percent === null ? "Mới" : `${netChange.percent >= 0 ? "+" : ""}${netChange.percent.toFixed(1)}%`}
            </p>
          </div>
          <div className="rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/50">
            <p className="text-[11px] text-muted">Chuyển khoản</p>
            <p className="text-sm font-semibold text-text">{formatCompactMoney(totalsCurrent.transfer)}</p>
            <p className="text-[11px] text-muted">{filteredCurrent.length} giao dịch</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-background/40 p-4 ring-1 ring-border/30">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Dòng tiền theo ngày</p>
        {daily.buckets.length === 0 ? (
          <p className="text-[13px] text-muted">Không có dữ liệu.</p>
        ) : (
          <div className="space-y-2">
            {daily.buckets.map((item) => {
              const incomeWidth = daily.maxValue > 0 ? Math.max(4, (item.income / daily.maxValue) * 100) : 0;
              const expenseWidth = daily.maxValue > 0 ? Math.max(4, (item.expense / daily.maxValue) * 100) : 0;
              return (
                <div key={`${item.label}-${item.index}`} className="rounded-xl bg-card/50 p-2">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                    <span>{item.label}</span>
                    <span className={item.net >= 0 ? "text-emerald-300" : "text-red-300"}>
                      {item.net >= 0 ? "+" : "-"}
                      {formatCompactMoney(item.net)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-card">
                      <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${incomeWidth}%` }} />
                    </div>
                    <div className="h-1.5 rounded-full bg-card">
                      <div className="h-full rounded-full bg-red-400/80" style={{ width: `${expenseWidth}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-background/40 p-4 ring-1 ring-border/30">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Top mục chi</p>
          {expenseCategories.length === 0 ? (
            <p className="text-[13px] text-muted">Chưa có khoản chi trong kỳ.</p>
          ) : (
            <ul className="space-y-2">
              {expenseCategories.slice(0, 6).map((item) => {
                const ratio = totalsCurrent.expense > 0 ? (item.total / totalsCurrent.expense) * 100 : 0;
                return (
                  <li key={item.category} className="rounded-xl bg-card/60 px-3 py-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[13px] text-text">{item.category}</span>
                      <span className="text-[12px] text-red-300">{formatCompactMoney(item.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-card">
                      <div className="h-full rounded-full bg-red-400/80" style={{ width: `${Math.max(4, ratio)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-3xl bg-background/40 p-4 ring-1 ring-border/30">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Top mục thu</p>
          {incomeCategories.length === 0 ? (
            <p className="text-[13px] text-muted">Chưa có khoản thu trong kỳ.</p>
          ) : (
            <ul className="space-y-2">
              {incomeCategories.slice(0, 6).map((item) => {
                const ratio = totalsCurrent.income > 0 ? (item.total / totalsCurrent.income) * 100 : 0;
                return (
                  <li key={item.category} className="rounded-xl bg-card/60 px-3 py-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[13px] text-text">{item.category}</span>
                      <span className="text-[12px] text-emerald-300">{formatCompactMoney(item.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-card">
                      <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${Math.max(4, ratio)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-background/40 p-4 ring-1 ring-border/30">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Dòng tiền theo nguồn</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(["cash", "bank", "gold"] as AccountType[]).map((type) => (
            <div key={type} className="rounded-xl bg-card/60 px-3 py-2">
              <p className="text-[12px] text-muted">{sourceTitle(type)}</p>
              <p className="text-[12px] text-emerald-300">Vào: {formatCompactMoney(sourceFlow[type].in)}</p>
              <p className="text-[12px] text-red-300">Ra: {formatCompactMoney(sourceFlow[type].out)}</p>
              <p className={`text-[12px] ${sourceFlow[type].net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                Ròng: {sourceFlow[type].net >= 0 ? "+" : "-"}
                {formatCompactMoney(sourceFlow[type].net)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-background/40 p-4 ring-1 ring-border/30">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Giao dịch trong kỳ</p>
        {recent.length === 0 ? (
          <p className="text-[13px] text-muted">Chưa có giao dịch.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between rounded-xl bg-card/60 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-[13px] text-text">
                    {tx.type === "income" ? "Thu" : tx.type === "expense" ? "Chi" : "Chuyển"}{" "}
                    {tx.category ? `· ${tx.category}` : ""}
                  </span>
                  <span className="text-[11px] text-muted">
                    {new Date(tx.created_at).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <span
                  className={`text-[12px] ${
                    tx.type === "income" ? "text-emerald-300" : tx.type === "expense" ? "text-red-300" : "text-text"
                  }`}
                >
                  {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                  {formatCompactMoney(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
