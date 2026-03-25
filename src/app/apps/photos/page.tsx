"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { PhotoShell } from "@/modules/photos/components/photo-shell";

export default function PhotosPage() {
  return (
    <AuthGate>
      <AppShell title={"Ảnh"} subtitle={"Lưu ảnh, quản lý album và lấy đường dẫn nhanh."}>
        <PhotoShell />
      </AppShell>
    </AuthGate>
  );
}
