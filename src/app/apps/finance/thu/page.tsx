"use client";

import { AuthGate } from "@/components/auth-gate";
import { FinanceIncome } from "@/modules/finance/components/finance-income";

export default function FinanceIncomePage() {
  return (
    <AuthGate>
      <div className="icloud-notes min-h-[calc(100dvh-44px)]">
        <FinanceIncome />
      </div>
    </AuthGate>
  );
}
