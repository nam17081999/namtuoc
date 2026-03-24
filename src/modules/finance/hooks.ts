import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustGoldHolding,
  createAccount,
  createCategory,
  createTransaction,
  fetchAccounts,
  fetchCategories,
  fetchGoldHolding,
  fetchTransactions,
  ensureDefaultCashAndBankAccounts,
  upsertGoldHolding
} from "./api";
import { fetchVnGoldQuote } from "./gold-price";
import { Account, Transaction } from "./types";

export function useAccounts() {
  return useQuery({
    queryKey: ["finance", "accounts"],
    queryFn: fetchAccounts,
    refetchOnMount: true
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["finance", "categories"], queryFn: fetchCategories });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["finance", "transactions"],
    queryFn: fetchTransactions,
    refetchOnMount: true
  });
}

export function useGoldHolding() {
  return useQuery({
    queryKey: ["finance", "gold"],
    queryFn: fetchGoldHolding,
    refetchOnMount: true
  });
}

export function useGoldPrice() {
  return useQuery({
    queryKey: ["finance", "gold-price"],
    queryFn: fetchVnGoldQuote,
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 3
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; type: Account["type"] }) => createAccount(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance", "accounts"] });
    }
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance", "categories"] });
    }
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Transaction, "id" | "created_at" | "user_id">) => createTransaction(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance", "transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["finance", "accounts"] });
    }
  });
}

export function useUpdateGoldHolding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quantity: number) => upsertGoldHolding(quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance", "gold"] });
    }
  });
}

export function useAdjustGoldHolding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deltaChi: number) => adjustGoldHolding(deltaChi),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finance", "gold"] });
    }
  });
}

export function useEnsureDefaultCashBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (existingAccounts?: Account[]) => ensureDefaultCashAndBankAccounts(existingAccounts),
    onSuccess: (accounts) => {
      queryClient.setQueryData(["finance", "accounts"], accounts);
    }
  });
}
