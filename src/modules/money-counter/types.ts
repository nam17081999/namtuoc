export interface MoneySession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface MoneyItem {
  id: string;
  session_id: string;
  denomination: number;
  quantity: number;
}
