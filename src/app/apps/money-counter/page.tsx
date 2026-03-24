"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { MoneyCounterShell } from "@/modules/money-counter/components/money-counter-shell";

export default function MoneyCounterPage() {
  return (
    <AuthGate>
      <AppShell title="Đếm tiền" subtitle="Đếm tiền mặt nhanh, tự lưu phiên.">
        <MoneyCounterShell />
      </AppShell>
    </AuthGate>
  );
}
