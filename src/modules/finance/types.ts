export type AccountType = "cash" | "bank" | "gold";
export type TransactionType = "expense" | "income" | "transfer" | "buy_gold" | "sell_gold";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  from_account: string | null;
  to_account: string | null;
  amount: number;
  category: string | null;
  note: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
}

export interface GoldHolding {
  id: string;
  user_id: string;
  quantity_chi: number;
}
