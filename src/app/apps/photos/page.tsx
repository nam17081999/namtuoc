"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { PhotoShell } from "@/modules/photos/components/photo-shell";

export default function PhotosPage() {
  return (
    <AuthGate>
      <AppShell title={"\u1ea2nh"} subtitle={"L\u01b0u \u1ea3nh, qu\u1ea3n l\u00fd album v\u00e0 l\u1ea5y \u0111\u01b0\u1eddng d\u1eabn nhanh."}>
        <PhotoShell />
      </AppShell>
    </AuthGate>
  );
}
