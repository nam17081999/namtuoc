"use client";

import { AuthGate } from "@/components/auth-gate";
import { FinanceTransfer } from "@/modules/finance/components/finance-transfer";

export default function FinanceTransferPage() {
  return (
    <AuthGate>
      <div className="icloud-notes min-h-[calc(100dvh-44px)]">
        <FinanceTransfer />
      </div>
    </AuthGate>
  );
}
