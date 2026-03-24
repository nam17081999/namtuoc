"use client";

import { AuthGate } from "@/components/auth-gate";
import { FinanceOverview } from "@/modules/finance/components/finance-overview";

export default function FinancePage() {
  return (
    <AuthGate>
      <div className="icloud-notes min-h-[calc(100dvh-44px)]">
        <FinanceOverview />
      </div>
    </AuthGate>
  );
}
