import { supabase } from "@/core/supabase/client";
import { MoneyItem, MoneySession } from "./types";

export async function createMoneySession() {
  const { data, error } = await supabase.from("money_sessions").insert({}).select().single();
  if (error) throw error;
  return data as MoneySession;
}

export async function upsertMoneyItems(sessionId: string, items: Array<Omit<MoneyItem, "id" | "session_id">>) {
  const payload = items.map((item) => ({
    session_id: sessionId,
    denomination: item.denomination,
    quantity: item.quantity
  }));

  const { error } = await supabase.from("money_items").upsert(payload, {
    onConflict: "session_id,denomination"
  });

  if (error) throw error;
}

export async function fetchLatestSession() {
  const { data, error } = await supabase
    .from("money_sessions")
    .select("id, user_id, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as MoneySession | null;
}

export async function fetchMoneySessions() {
  const { data, error } = await supabase
    .from("money_sessions")
    .select("id, user_id, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as MoneySession[];
}

export async function fetchSessionItems(sessionId: string) {
  const { data, error } = await supabase
    .from("money_items")
    .select("id, session_id, denomination, quantity")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data ?? []) as MoneyItem[];
}
