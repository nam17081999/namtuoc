"use client";

import { AuthGate } from "@/components/auth-gate";
import { FinanceExpense } from "@/modules/finance/components/finance-expense";

export default function FinanceExpensePage() {
  return (
    <AuthGate>
      <div className="icloud-notes min-h-[calc(100dvh-44px)]">
        <FinanceExpense />
      </div>
    </AuthGate>
  );
}
