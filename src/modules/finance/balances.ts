import type { Account, Transaction } from "./types";

export function computeAccountBalances(accounts: Account[], transactions: Transaction[]) {
  const base: Record<string, number> = {};
  accounts.forEach((account) => {
    base[account.id] = 0;
  });

  const apply = (accountId: string | null, delta: number) => {
    if (!accountId) return;
    base[accountId] = (base[accountId] ?? 0) + delta;
  };

  transactions.forEach((tx) => {
    switch (tx.type) {
      case "expense":
        apply(tx.from_account, -tx.amount);
        break;
      case "income":
        apply(tx.to_account, tx.amount);
        break;
      case "transfer":
        apply(tx.from_account, -tx.amount);
        apply(tx.to_account, tx.amount);
        break;
      case "buy_gold":
        apply(tx.from_account, -tx.amount);
        break;
      case "sell_gold":
        apply(tx.to_account, tx.amount);
        break;
      default:
        break;
    }
  });

  return base;
}
