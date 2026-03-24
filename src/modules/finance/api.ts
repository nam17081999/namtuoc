import { supabase } from "@/core/supabase/client";
import { Account, Category, GoldHolding, Transaction } from "./types";

export async function fetchAccounts() {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, type, user_id")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Account[];
}

export async function createAccount(payload: { name: string; type: Account["type"] }) {
  const { data, error } = await supabase.from("accounts").insert(payload).select("id, name, type, user_id").single();
  if (error) throw error;
  return data as Account;
}

export async function fetchCategories() {
  const { data, error } = await supabase.from("categories").select("id, name, user_id");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(name: string) {
  const { data, error } = await supabase.from("categories").insert({ name }).select("id, name, user_id").single();
  if (error) throw error;
  return data as Category;
}

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, from_account, to_account, amount, category, note, created_at, user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function createTransaction(payload: Omit<Transaction, "id" | "created_at" | "user_id">) {
  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select("id, type, from_account, to_account, amount, category, note, created_at, user_id")
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function fetchGoldHolding() {
  const { data, error } = await supabase
    .from("gold_holdings")
    .select("id, quantity_chi, user_id")
    .order("id", { ascending: false })
    .limit(2);
  if (error) throw error;

  const rows = (data ?? []) as GoldHolding[];
  const primary = rows[0] ?? null;
  if (!primary) return null;

  if (rows.length > 1) {
    const { error: cleanupError } = await supabase.from("gold_holdings").delete().neq("id", primary.id);
    if (cleanupError) {
      console.warn("Failed to cleanup duplicate gold_holdings rows:", cleanupError.message);
    }
  }

  return primary;
}

export async function upsertGoldHolding(quantity_chi: number, holdingId?: string) {
  const targetId = holdingId ?? (await fetchGoldHolding())?.id;

  if (targetId) {
    const { data, error } = await supabase
      .from("gold_holdings")
      .update({ quantity_chi })
      .eq("id", targetId)
      .select("id, quantity_chi, user_id")
      .single();
    if (error) throw error;
    return data as GoldHolding;
  }

  const { data, error } = await supabase
    .from("gold_holdings")
    .insert({ quantity_chi })
    .select("id, quantity_chi, user_id")
    .single();
  if (error) throw error;
  return data as GoldHolding;
}

export async function adjustGoldHolding(deltaChi: number) {
  const current = await fetchGoldHolding();
  const next = Number(((current?.quantity_chi ?? 0) + deltaChi).toFixed(4));
  if (next < 0) {
    const err = new Error("INSUFFICIENT_GOLD");
    (err as Error & { code?: string }).code = "INSUFFICIENT_GOLD";
    throw err;
  }
  return upsertGoldHolding(next, current?.id);
}

export async function ensureDefaultCashAndBankAccounts(existingAccounts?: Account[]) {
  const existing = existingAccounts ?? (await fetchAccounts());

  const hasCash = existing.some((a) => a.type === "cash");
  const hasBank = existing.some((a) => a.type === "bank");
  const hasGold = existing.some((a) => a.type === "gold");

  if (hasCash && hasBank && hasGold) {
    return existing;
  }

  if (!hasCash) {
    await createAccount({ name: "Tiền mặt", type: "cash" });
  }
  if (!hasBank) {
    await createAccount({ name: "Ngân hàng", type: "bank" });
  }
  if (!hasGold) {
    await createAccount({ name: "Vàng", type: "gold" });
  }

  return fetchAccounts();
}
