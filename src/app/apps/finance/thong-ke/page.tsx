"use client";

import { AuthGate } from "@/components/auth-gate";
import { FinanceStats } from "@/modules/finance/components/finance-stats";

export default function FinanceStatsPage() {
  return (
    <AuthGate>
      <div className="icloud-notes min-h-[calc(100dvh-44px)]">
        <FinanceStats />
      </div>
    </AuthGate>
  );
}
