"use client";

import { AuthGate } from "@/components/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { PhotoShell } from "@/modules/photos/components/photo-shell";

interface AlbumPageProps {
  params: {
    folderId: string;
  };
}

export default function PhotoAlbumPage({ params }: AlbumPageProps) {
  return (
    <AuthGate>
      <AppShell title={"\u1ea2nh"} subtitle="Xem album">
        <PhotoShell folderId={params.folderId} />
      </AppShell>
    </AuthGate>
  );
}
