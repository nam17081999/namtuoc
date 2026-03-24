import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMoneySession, fetchLatestSession, fetchMoneySessions, fetchSessionItems, upsertMoneyItems } from "./api";

export function useLatestMoneySession() {
  return useQuery({ queryKey: ["money", "latest"], queryFn: fetchLatestSession });
}

export function useMoneySessions() {
  return useQuery({ queryKey: ["money", "sessions"], queryFn: fetchMoneySessions });
}

export function useMoneySessionItems(sessionId?: string | null) {
  return useQuery({
    queryKey: ["money", "items", sessionId ?? "none"],
    queryFn: () => (sessionId ? fetchSessionItems(sessionId) : Promise.resolve([])),
    enabled: Boolean(sessionId)
  });
}

export function useCreateMoneySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMoneySession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["money", "sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["money", "latest"] });
    }
  });
}

export function useUpsertMoneyItems() {
  return useMutation({
    mutationFn: ({ sessionId, items }: { sessionId: string; items: Array<{ denomination: number; quantity: number }> }) =>
      upsertMoneyItems(sessionId, items)
  });
}
