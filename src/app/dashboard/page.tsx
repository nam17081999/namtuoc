"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, PlusCircle, Search } from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
import { AppTile } from "@/components/app-tile";
import { APP_LIST } from "@/core/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { formatMoneyGroupedSpaces } from "@/core/utils/format-money";
import { EXPENSE_CATEGORY_KEYWORDS, INCOME_CATEGORY_KEYWORDS } from "@/modules/finance/category-keywords";
import { useAccounts, useCategories, useCreateAccount, useCreateTransaction, useTransactions } from "@/modules/finance/hooks";
import { useNotes, useUpsertNote } from "@/modules/notes/hooks";
import { useMoneySessions } from "@/modules/money-counter/hooks";
import { useNotesUIStore } from "@/store/notes-store";
import type { Account } from "@/modules/finance/types";

type QuickType = "expense" | "income" | "note";

type SearchItem = {
  id: string;
  kind: "note" | "transaction" | "session";
  title: string;
  subtitle: string;
  href: string;
  date: number;
  onClick?: () => void;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function buildPhraseCandidates(text: string) {
  const tokens = normalizeText(text).split(" ").filter(Boolean);
  const phrases: string[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    phrases.push(tokens[i]);
    if (i + 1 < tokens.length) phrases.push(`${tokens[i]} ${tokens[i + 1]}`);
    if (i + 2 < tokens.length) phrases.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }
  return Array.from(new Set(phrases));
}

function isFuzzyMatch(candidate: string, keyword: string) {
  if (!candidate || !keyword) return false;
  const maxDistance = Math.floor(keyword.length * 0.3);
  return levenshtein(candidate, keyword) <= Math.max(1, maxDistance);
}

function findCategoryByKeywords(text: string, maps: { category: string; keywords: string[] }[]) {
  const normalized = normalizeText(text);
  const candidates = buildPhraseCandidates(text);
  let bestCategory: string | null = null;
  let bestScore = -Infinity;

  maps.forEach((map) => {
    map.keywords.forEach((keyword) => {
      const key = normalizeText(keyword);
      if (!key) return;
      if (normalized.includes(key)) {
        const score = key.length * 2;
        if (score > bestScore) {
          bestScore = score;
          bestCategory = map.category;
        }
        return;
      }
      for (const candidate of candidates) {
        if (isFuzzyMatch(candidate, key)) {
          const distance = levenshtein(candidate, key);
          const score = key.length - distance;
          if (score > bestScore) {
            bestScore = score;
            bestCategory = map.category;
          }
        }
      }
    });
  });

  return bestCategory;
}

function findCategoryByExisting(text: string, existing: Array<{ name: string }>) {
  const normalized = normalizeText(text);
  let bestCategory: string | null = null;
  let bestScore = -Infinity;

  existing.forEach((item) => {
    const key = normalizeText(item.name);
    if (!key) return;
    if (normalized.includes(key) || key.includes(normalized)) {
      const score = key.length;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = item.name;
      }
    }
  });

  return bestCategory;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseMoneyInput(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^(chi|thu)\s+/i, "")
    .replace(/^note:\s*/i, "");
  const match = cleaned.match(/([0-9]+(?:[.,][0-9]+)?)\s*(k|m|tr)?/i);
  if (!match) return null;
  const suffix = match[2]?.toLowerCase();
  const rawNumber = match[1];
  const parsed = Number.parseFloat(rawNumber.replace(",", "."));
  const amount = suffix
    ? Math.round(parsed * (suffix === "k" ? 1000 : 1_000_000))
    : Math.round(parsed * 1000);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const note = cleaned.replace(match[0], "").trim();
  return { amount, note };
}

export default function DashboardPage() {

  const { data: transactions = [] } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: notes = [] } = useNotes(null);
  const { data: sessions = [] } = useMoneySessions();

  const createTransaction = useCreateTransaction();
  const createAccount = useCreateAccount();
  const upsertNote = useUpsertNote();
  const { setActiveFolder, setActiveNote } = useNotesUIStore();

  const [quickType, setQuickType] = useState<QuickType>("expense");
  const [quickText, setQuickText] = useState("");
  const [quickStatus, setQuickStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [quickError, setQuickError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const resolveCashAccount = async (): Promise<Account> => {
    const found = accounts.find((acc) => acc.type === "cash");
    if (found) return found;
    return createAccount.mutateAsync({ name: "Tiền mặt", type: "cash" });
  };

  const handleQuickAdd = async () => {
    setQuickError(null);
    setQuickStatus("saving");

    if (!quickText.trim()) {
      setQuickError("Nhập nội dung.");
      setQuickStatus("error");
      return;
    }

    if (quickType === "note") {
      const title = quickText.trim().slice(0, 80) || "Ghi chú mới";
      const content = `<p>${escapeHtml(quickText.trim())}</p>`;
      await upsertNote.mutateAsync({ title, content });
      setQuickText("");
      setQuickStatus("saved");
      return;
    }

    const parsed = parseMoneyInput(quickText);
    if (!parsed) {
      setQuickError("Không nhận được số tiền.");
      setQuickStatus("error");
      return;
    }

    const account = await resolveCashAccount();
    const inferredCategory =
      quickType === "expense"
        ? findCategoryByKeywords(quickText, EXPENSE_CATEGORY_KEYWORDS) ?? findCategoryByExisting(quickText, categories)
        : quickType === "income"
          ? findCategoryByKeywords(quickText, INCOME_CATEGORY_KEYWORDS) ?? findCategoryByExisting(quickText, categories)
          : null;

    await createTransaction.mutateAsync({
      type: quickType,
      from_account: quickType === "expense" ? account.id : null,
      to_account: quickType === "income" ? account.id : null,
      amount: parsed.amount,
      category: inferredCategory ?? "Khác",
      note: parsed.note || null
    });
    setQuickText("");
    setQuickStatus("saved");
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    const items: SearchItem[] = [];

    notes.forEach((note) => {
      const title = note.title ?? "Ghi chú";
      const content = stripHtml(note.content ?? "");
      if (`${title} ${content}`.toLowerCase().includes(query)) {
        const date = note.updated_at ? new Date(note.updated_at).getTime() : 0;
        items.push({
          id: note.id,
          kind: "note",
          title,
          subtitle: content.slice(0, 80),
          href: "/apps/notes",
          date,
          onClick: () => {
            setActiveFolder(note.folder_id ?? null);
            setActiveNote(note.id);
          }
        });
      }
    });

    transactions.forEach((tx) => {
      const content = `${tx.type} ${tx.category ?? ""} ${tx.note ?? ""} ${tx.amount}`.toLowerCase();
      if (!content.includes(query)) return;
      const label = tx.type === "income" ? "Thu" : tx.type === "expense" ? "Chi" : "Chuyển";
      items.push({
        id: tx.id,
        kind: "transaction",
        title: `${label} ${formatMoneyGroupedSpaces(Math.round(Number(tx.amount)))} đ`,
        subtitle: `${tx.category ?? "Khác"} · ${tx.note ?? ""}`,
        href: "/apps/finance",
        date: new Date(tx.created_at).getTime()
      });
    });

    sessions.forEach((session) => {
      const label = new Date(session.created_at).toLocaleDateString("vi-VN");
      if (!label.toLowerCase().includes(query)) return;
      items.push({
        id: session.id,
        kind: "session",
        title: `Phiên đếm tiền ${label}`,
        subtitle: "Mở lại phiên đếm tiền",
        href: "/apps/money-counter",
        date: new Date(session.created_at).getTime()
      });
    });

    return items.sort((a, b) => b.date - a.date).slice(0, 12);
  }, [searchQuery, notes, transactions, sessions, setActiveFolder, setActiveNote]);

  return (
    <AuthGate>
      <main className="mx-auto flex min-h-[calc(100dvh-44px)] w-full max-w-6xl flex-col gap-8 px-4 pb-8 pt-6 sm:px-6 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-surface/80 p-4 shadow-sm backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Thêm nhanh</p>
                <span className="text-[11px] text-muted">Nhập nhanh thu/chi/ghi chú</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
                <Input
                  placeholder="vd: chi 50k cafe / thu 2tr lương / note: gọi cho A"
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                />
                <Segmented
                  options={[
                    { value: "expense", label: "Chi" },
                    { value: "income", label: "Thu" },
                    { value: "note", label: "Ghi chú" }
                  ]}
                  value={quickType}
                  onChange={(value) => setQuickType(value as QuickType)}
                  className="bg-card/80"
                />
              </div>
              {quickError ? <p className="mt-2 text-[12px] text-red-400">{quickError}</p> : null}
              {quickStatus === "saved" ? <p className="mt-2 text-[12px] text-emerald-400">Đã lưu.</p> : null}
              <div className="mt-3 flex justify-end">
                <Button
                  className="rounded-full bg-amber-500 text-[#0c0f18]"
                  onClick={() => void handleQuickAdd()}
                  disabled={quickStatus === "saving"}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Lưu nhanh
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-surface/80 p-4 shadow-sm backdrop-blur-xl sm:p-5">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-amber-300" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Tìm kiếm</p>
                  <p className="text-[12px] text-muted">Tìm ghi chú, giao dịch, phiên đếm tiền</p>
                </div>
              </div>
              <div className="mt-3">
                <Input placeholder="Nhập từ khóa" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="mt-3 space-y-2">
                {searchQuery.trim().length < 2 ? (
                  <p className="text-[12px] text-muted">Nhập từ 2 ký tự để tìm.</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-[12px] text-muted">Không tìm thấy.</p>
                ) : (
                  searchResults.map((item) => (
                    <Link
                      key={`${item.kind}-${item.id}`}
                      href={item.href}
                      className="flex items-center justify-between rounded-2xl bg-card/70 px-3 py-2 text-[12px] text-text ring-1 ring-border/40"
                      onClick={item.onClick}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-[11px] text-muted">{item.subtitle}</span>
                      </div>
                      <ArrowDownUp className="h-4 w-4 text-muted" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-surface/80 p-4 shadow-sm backdrop-blur-xl sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted sm:text-[11px]">
                  Danh sách ứng dụng
                </h2>
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:gap-x-6 sm:gap-y-6">
                {APP_LIST.map((app, index) => (
                  <AppTile
                    key={`${app.id}-${index}`}
                    name={app.name}
                    href={app.href}
                    imgSrc={app.imgSrc}
                    className="justify-self-center"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </AuthGate>
  );
}
