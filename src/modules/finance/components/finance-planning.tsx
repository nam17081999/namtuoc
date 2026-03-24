"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, PlusCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { formatMoneyGroupedSpaces } from "@/core/utils/format-money";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { useAccounts, useCreateAccount, useCreateTransaction, useTransactions } from "../hooks";
import type { Account } from "../types";

type BudgetItem = {
  id: string;
  category: string;
  amount: number;
};

type RecurringItem = {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  accountType: "cash" | "bank";
  dayOfMonth: number;
  note?: string;
  lastApplied?: string;
};

type GoalItem = {
  id: string;
  name: string;
  target: number;
  current: number;
  dueDate?: string;
};

type PlanningState = {
  budgets: BudgetItem[];
  recurring: RecurringItem[];
  goals: GoalItem[];
};

const STORAGE_KEY = "finance-planning-v1";
const DEFAULT_STATE: PlanningState = { budgets: [], recurring: [], goals: [] };

function monthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function startOfMonth(date: Date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfMonthExclusive(date: Date) {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

export function FinancePlanning() {
  const { data: transactions = [] } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const createTransaction = useCreateTransaction();
  const createAccount = useCreateAccount();

  const [state, setState] = useLocalStorageState<PlanningState>(STORAGE_KEY, DEFAULT_STATE);

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState(0);

  const [recurringType, setRecurringType] = useState<RecurringItem["type"]>("expense");
  const [recurringCategory, setRecurringCategory] = useState("");
  const [recurringAmount, setRecurringAmount] = useState(0);
  const [recurringDay, setRecurringDay] = useState(1);
  const [recurringAccountType, setRecurringAccountType] = useState<RecurringItem["accountType"]>("bank");
  const [recurringNote, setRecurringNote] = useState("");

  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState(0);
  const [goalDue, setGoalDue] = useState("");
  const [goalAddAmount, setGoalAddAmount] = useState<Record<string, number>>({});

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonthExclusive(now);
  const activeMonthKey = monthKey(now);

  const monthTransactions = useMemo(
    () =>
      transactions.filter((tx) => {
        const time = new Date(tx.created_at).getTime();
        return time >= monthStart.getTime() && time < monthEnd.getTime();
      }),
    [transactions, monthStart, monthEnd]
  );

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const key = tx.category ?? "Khác";
        map.set(key, (map.get(key) ?? 0) + Number(tx.amount));
      });
    return map;
  }, [monthTransactions]);

  const monthIncome = useMemo(
    () => monthTransactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount), 0),
    [monthTransactions]
  );
  const monthExpense = useMemo(
    () => monthTransactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount), 0),
    [monthTransactions]
  );
  const monthNet = monthIncome - monthExpense;

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(0, daysInMonth - now.getDate());

  const last30Start = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const avgDailyNet = useMemo(() => {
    const list = transactions.filter((tx) => new Date(tx.created_at).getTime() >= last30Start.getTime());
    const net = list.reduce((sum, tx) => {
      const amt = Number(tx.amount);
      if (tx.type === "income") return sum + amt;
      if (tx.type === "expense") return sum - amt;
      return sum;
    }, 0);
    return net / 30;
  }, [transactions, last30Start]);

  const remainingRecurringNet = useMemo(() => {
    return state.recurring.reduce((sum, item) => {
      if (item.lastApplied === activeMonthKey) return sum;
      const delta = item.type === "income" ? item.amount : -item.amount;
      return sum + delta;
    }, 0);
  }, [state.recurring, activeMonthKey]);

  const forecastNet = monthNet + avgDailyNet * remainingDays + remainingRecurringNet;

  const resolveAccount = async (type: "cash" | "bank"): Promise<Account> => {
    const existing = accounts.find((acc) => acc.type === type);
    if (existing) return existing;
    return createAccount.mutateAsync({
      name: type === "cash" ? "Tiền mặt" : "Ngân hàng",
      type
    });
  };

  const handleAddBudget = () => {
    const category = budgetCategory.trim();
    if (!category || budgetAmount <= 0) return;
    const item: BudgetItem = { id: createId(), category, amount: budgetAmount };
    setState((prev) => ({ ...prev, budgets: [item, ...prev.budgets] }));
    setBudgetCategory("");
    setBudgetAmount(0);
  };

  const handleAddRecurring = () => {
    const category = recurringCategory.trim() || "Khác";
    if (recurringAmount <= 0) return;
    const item: RecurringItem = {
      id: createId(),
      type: recurringType,
      category,
      amount: recurringAmount,
      accountType: recurringAccountType,
      dayOfMonth: Math.min(28, Math.max(1, Number(recurringDay) || 1)),
      note: recurringNote.trim() || undefined
    };
    setState((prev) => ({ ...prev, recurring: [item, ...prev.recurring] }));
    setRecurringCategory("");
    setRecurringAmount(0);
    setRecurringDay(1);
    setRecurringNote("");
  };

  const applyRecurring = async (item: RecurringItem) => {
    const account = await resolveAccount(item.accountType);
    await createTransaction.mutateAsync({
      type: item.type,
      from_account: item.type === "expense" ? account.id : null,
      to_account: item.type === "income" ? account.id : null,
      amount: item.amount,
      category: item.category,
      note: item.note ?? "Định kỳ"
    });

    setState((prev) => ({
      ...prev,
      recurring: prev.recurring.map((row) =>
        row.id === item.id ? { ...row, lastApplied: activeMonthKey } : row
      )
    }));
  };

  const applyAllRecurring = async () => {
    const targets = state.recurring.filter((item) => item.lastApplied !== activeMonthKey);
    for (const item of targets) {
      // eslint-disable-next-line no-await-in-loop
      await applyRecurring(item);
    }
  };

  const handleAddGoal = () => {
    const name = goalName.trim();
    if (!name || goalTarget <= 0) return;
    const item: GoalItem = {
      id: createId(),
      name,
      target: goalTarget,
      current: 0,
      dueDate: goalDue || undefined
    };
    setState((prev) => ({ ...prev, goals: [item, ...prev.goals] }));
    setGoalName("");
    setGoalTarget(0);
    setGoalDue("");
  };

  const addGoalProgress = (goalId: string) => {
    const delta = goalAddAmount[goalId] ?? 0;
    if (delta <= 0) return;
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) =>
        goal.id === goalId ? { ...goal, current: Math.max(0, goal.current + delta) } : goal
      )
    }));
    setGoalAddAmount((prev) => ({ ...prev, [goalId]: 0 }));
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-12 pt-4 sm:px-5">
      <div className="flex items-center gap-2">
        <Link
          href="/apps/finance"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 ring-1 ring-border/40"
          aria-label="Quay lại"
        >
          <ChevronLeft className="h-5 w-5 text-text" />
        </Link>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Kế hoạch</p>
          <h1 className="text-lg font-semibold text-text">Budget, định kỳ, mục tiêu</h1>
        </div>
      </div>

      <section className="rounded-3xl bg-background/60 p-4 ring-1 ring-border/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Tổng quan tháng</p>
            <p className="text-sm text-text">
              {formatDateShort(monthStart)} - {formatDateShort(new Date(monthEnd.getTime() - 1))}
            </p>
          </div>
          <div className="rounded-2xl bg-card/70 px-3 py-2 text-[12px] text-muted ring-1 ring-border/40">
            Còn {remainingDays} ngày
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-emerald-500/10 px-3 py-3 ring-1 ring-emerald-400/20">
            <p className="text-[11px] text-muted">Thu</p>
            <p className="text-sm font-semibold text-emerald-300">
              {formatMoneyGroupedSpaces(Math.round(monthIncome))} đ
            </p>
          </div>
          <div className="rounded-2xl bg-red-500/10 px-3 py-3 ring-1 ring-red-400/20">
            <p className="text-[11px] text-muted">Chi</p>
            <p className="text-sm font-semibold text-red-300">
              {formatMoneyGroupedSpaces(Math.round(monthExpense))} đ
            </p>
          </div>
          <div className="rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/40">
            <p className="text-[11px] text-muted">Ròng dự kiến</p>
            <p className={`text-sm font-semibold ${forecastNet >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {forecastNet >= 0 ? "+" : "-"}
              {formatMoneyGroupedSpaces(Math.round(Math.abs(forecastNet)))} đ
            </p>
            <p className="text-[10px] text-muted">
              TB/ngày {formatMoneyGroupedSpaces(Math.round(avgDailyNet))} đ
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-background/60 p-4 ring-1 ring-border/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Budget theo mục</p>
            <p className="text-[12px] text-muted">So sánh mức chi và thực tế</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px_120px]">
          <Input placeholder="Danh mục (vd: Ăn uống)" value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} />
          <MoneyInput value={budgetAmount} onValueChange={setBudgetAmount} placeholder="Số tiền" />
          <Button className="rounded-2xl bg-amber-500 text-[#0c0f18]" onClick={handleAddBudget}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {state.budgets.length === 0 ? (
            <p className="text-[12px] text-muted">Chưa có budget. Tạo danh mục đầu tiên.</p>
          ) : (
            state.budgets.map((item) => {
              const actual = expenseByCategory.get(item.category) ?? 0;
              const ratio = item.amount > 0 ? Math.min(100, (actual / item.amount) * 100) : 0;
              return (
                <div key={item.id} className="rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/40">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text">{item.category}</span>
                    <span className="text-muted">
                      {formatMoneyGroupedSpaces(Math.round(actual))} / {formatMoneyGroupedSpaces(Math.round(item.amount))} đ
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-card">
                    <div className="h-full rounded-full bg-amber-400/80" style={{ width: `${Math.max(6, ratio)}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-background/60 p-4 ring-1 ring-border/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Giao dịch định kỳ</p>
            <p className="text-[12px] text-muted">Tự động tạo thu/chi hàng tháng</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full px-3 text-[11px]"
            onClick={() => void applyAllRecurring()}
            disabled={state.recurring.length === 0}
          >
            Áp dụng tháng này
          </Button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Segmented
            options={[
              { value: "expense", label: "Chi" },
              { value: "income", label: "Thu" }
            ]}
            value={recurringType}
            onChange={(value) => setRecurringType(value as RecurringItem["type"])}
            className="bg-card/80"
          />
          <Select value={recurringAccountType} onChange={(e) => setRecurringAccountType(e.target.value as RecurringItem["accountType"])}>
            <option value="bank">Ngân hàng</option>
            <option value="cash">Tiền mặt</option>
          </Select>
          <Input placeholder="Danh mục" value={recurringCategory} onChange={(e) => setRecurringCategory(e.target.value)} />
          <MoneyInput value={recurringAmount} onValueChange={setRecurringAmount} placeholder="Số tiền" />
          <Input
            type="number"
            min={1}
            max={28}
            placeholder="Ngày trong tháng (1-28)"
            value={recurringDay}
            onChange={(e) => setRecurringDay(Number(e.target.value))}
          />
          <Input placeholder="Ghi chú (tùy chọn)" value={recurringNote} onChange={(e) => setRecurringNote(e.target.value)} />
        </div>
        <div className="mt-3 flex justify-end">
          <Button className="rounded-2xl bg-amber-500 text-[#0c0f18]" onClick={handleAddRecurring}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm định kỳ
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          {state.recurring.length === 0 ? (
            <p className="text-[12px] text-muted">Chưa có giao dịch định kỳ.</p>
          ) : (
            state.recurring.map((item) => {
              const applied = item.lastApplied === activeMonthKey;
              return (
                <div key={item.id} className="rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/40">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text">
                      {item.type === "income" ? "Thu" : "Chi"} · {item.category}
                    </span>
                    <span className={item.type === "income" ? "text-emerald-300" : "text-red-300"}>
                      {formatMoneyGroupedSpaces(Math.round(item.amount))} đ
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                    <span>
                      Ngày {item.dayOfMonth} · {item.accountType === "bank" ? "Ngân hàng" : "Tiền mặt"}
                    </span>
                    <span>{applied ? "Đã áp dụng" : "Chưa áp dụng"}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full px-3 text-[11px]"
                      onClick={() => void applyRecurring(item)}
                      disabled={applied || createTransaction.isPending}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-background/60 p-4 ring-1 ring-border/40">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-300" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Mục tiêu</p>
            <p className="text-[12px] text-muted">Theo dõi tiến độ và mục tiêu tài chính</p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px_160px]">
          <Input placeholder="Tên mục tiêu" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
          <MoneyInput value={goalTarget} onValueChange={setGoalTarget} placeholder="Tổng tiền" />
          <Input type="date" value={goalDue} onChange={(e) => setGoalDue(e.target.value)} />
        </div>
        <div className="mt-3 flex justify-end">
          <Button className="rounded-2xl bg-amber-500 text-[#0c0f18]" onClick={handleAddGoal}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm mục tiêu
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          {state.goals.length === 0 ? (
            <p className="text-[12px] text-muted">Chưa có mục tiêu.</p>
          ) : (
            state.goals.map((goal) => {
              const ratio = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
              return (
                <div key={goal.id} className="rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/40">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text">{goal.name}</span>
                    <span className="text-muted">
                      {formatMoneyGroupedSpaces(Math.round(goal.current))} / {formatMoneyGroupedSpaces(Math.round(goal.target))} đ
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                    <span>{goal.dueDate ? `Hạn: ${goal.dueDate}` : "Không có hạn"}</span>
                    <span>{Math.round(ratio)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-card">
                    <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${Math.max(6, ratio)}%` }} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <MoneyInput
                      value={goalAddAmount[goal.id] ?? 0}
                      onValueChange={(value) => setGoalAddAmount((prev) => ({ ...prev, [goal.id]: value }))}
                      placeholder="Thêm số tiền"
                    />
                    <Button size="sm" variant="secondary" className="rounded-full px-3 text-[11px]" onClick={() => addGoalProgress(goal.id)}>
                      Cập nhật
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-background/60 p-4 ring-1 ring-border/40">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-amber-300" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Dự báo dòng tiền</p>
            <p className="text-[12px] text-muted">
              Dự đoán cuối tháng: {formatMoneyGroupedSpaces(Math.round(forecastNet))} đ
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/40">
            <p className="text-[11px] text-muted">Ròng hiện tại</p>
            <p className="text-sm font-semibold text-text">{formatMoneyGroupedSpaces(Math.round(monthNet))} đ</p>
          </div>
          <div className="rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/40">
            <p className="text-[11px] text-muted">Định kỳ chưa áp dụng</p>
            <p className={`text-sm font-semibold ${remainingRecurringNet >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {remainingRecurringNet >= 0 ? "+" : "-"}
              {formatMoneyGroupedSpaces(Math.round(Math.abs(remainingRecurringNet)))} đ
            </p>
          </div>
          <div className="rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/40">
            <p className="text-[11px] text-muted">Dự báo còn lại</p>
            <p className="text-sm font-semibold text-text">
              {formatMoneyGroupedSpaces(Math.round(avgDailyNet * remainingDays))} đ
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
