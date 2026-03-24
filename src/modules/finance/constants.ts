export const INCOME_TYPES = [
  { value: "salary", label: "Tiền lương" },
  { value: "bonus", label: "Tiền thưởng" },
  { value: "side_income", label: "Thu nhập phụ" },
  { value: "investment", label: "Đầu tư / lãi" },
  { value: "gift", label: "Quà tặng" },
  { value: "refund", label: "Hoàn tiền" },
  { value: "other", label: "Khác" }
] as const;

export type IncomeTypeValue = (typeof INCOME_TYPES)[number]["value"];

export const STORAGE_TYPES = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Tiền ngân hàng" },
  { value: "gold", label: "Vàng (nhập theo chỉ)" }
] as const;

export type StorageTypeValue = (typeof STORAGE_TYPES)[number]["value"];

export const EXPENSE_PURPOSES = [
  { value: "food", label: "Ăn uống" },
  { value: "entertainment", label: "Vui chơi" },
  { value: "clothes", label: "Quần áo" },
  { value: "essentials", label: "Nhu yếu phẩm" },
  { value: "transport", label: "Di chuyển" },
  { value: "health", label: "Sức khỏe" },
  { value: "bills", label: "Hóa đơn cố định" },
  { value: "wedding", label: "Cưới xin" },
  { value: "other", label: "Khác" }
] as const;

export type ExpensePurposeValue = (typeof EXPENSE_PURPOSES)[number]["value"];

export const EXPENSE_SOURCES = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Tiền ngân hàng" },
  { value: "gold", label: "Vàng (quy đổi theo giá hiện tại)" }
] as const;

export type ExpenseSourceValue = (typeof EXPENSE_SOURCES)[number]["value"];


