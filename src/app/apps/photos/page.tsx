"use client";

import { AuthGate } from "@/components/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { PhotoShell } from "@/modules/photos/components/photo-shell";

export default function PhotosPage() {
  return (
    <AuthGate>
      <AppShell>
        <PhotoShell />
      </AppShell>
    </AuthGate>
  );
}
