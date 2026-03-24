"use client";

import { AuthGate } from "@/components/auth-gate";
import { FinancePlanning } from "@/modules/finance/components/finance-planning";

export default function FinancePlanningPage() {
  return (
    <AuthGate>
      <div className="icloud-notes min-h-[calc(100dvh-44px)]">
        <FinancePlanning />
      </div>
    </AuthGate>
  );
}
