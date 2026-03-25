"use client";

import { useEffect, useRef } from "react";
import type { Route } from "next";
import Link from "next/link";
import { FolderOpen, MoreHorizontal, Sparkles } from "lucide-react";
import type { PhotoFolder } from "../types";

interface AlbumGridProps {
  folders: PhotoFolder[];
  photoCountByFolderId: Map<string, number>;
  showPhotoCounts: boolean;
  getAlbumHref: (folderId: string) => Route;
  openAlbumMenuId: string | null;
  onToggleMenu: (folderId: string | null) => void;
  onRenameAlbum: (folder: PhotoFolder) => void;
  onDeleteAlbum: (folder: PhotoFolder) => void;
}

export function AlbumGrid({
  folders,
  photoCountByFolderId,
  showPhotoCounts,
  getAlbumHref,
  openAlbumMenuId,
  onToggleMenu,
  onRenameAlbum,
  onDeleteAlbum
}: AlbumGridProps) {
  const activeMenuRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!openAlbumMenuId) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!activeMenuRef.current) return;
      if (activeMenuRef.current.contains(event.target as Node)) return;
      onToggleMenu(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [onToggleMenu, openAlbumMenuId]);

  if (folders.length === 0) {
    return (
      <div className="rounded-[30px] border border-border/40 bg-card/75 p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background/80 text-muted">
          <FolderOpen className="h-6 w-6" />
        </div>
        <p className="text-base font-medium text-text">Chưa có album nào</p>
        <p className="mt-1 text-sm text-muted">Tạo album đầu tiên để gom ảnh theo chủ đề hoặc công việc.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {folders.map((folder) => {
        const photoCount = showPhotoCounts ? photoCountByFolderId.get(folder.id) ?? 0 : null;

        return (
          <article
            key={folder.id}
            ref={openAlbumMenuId === folder.id ? activeMenuRef : null}
            className="group relative overflow-visible rounded-[30px] border border-border/40 bg-card/75 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.16)] backdrop-blur transition"
          >
            <Link
              href={getAlbumHref(folder.id)}
              className="block rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_42%),linear-gradient(135deg,rgba(106,162,255,0.28),rgba(255,255,255,0.03)_52%,rgba(83,208,186,0.18))] p-5">
                <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px]" />
                <div className="relative flex aspect-[4/3] flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/20 text-white backdrop-blur">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur">
                      <Sparkles className="h-3.5 w-3.5" />
                      Album
                    </div>
                  </div>

                  <div className="relative">
                    <p className="truncate text-lg font-semibold text-white">{folder.name}</p>
                    <p className="mt-1 text-sm text-white/72">
                      {photoCount !== null ? `${photoCount} ảnh` : "Mở để xem nội dung"}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <button
              type="button"
              aria-label={`Tùy chọn cho album ${folder.name}`}
              className="absolute right-5 top-5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white/80 backdrop-blur transition hover:bg-black/30 hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-0"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleMenu(openAlbumMenuId === folder.id ? null : folder.id);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {openAlbumMenuId === folder.id ? (
              <div className="absolute right-4 top-16 z-20 min-w-[160px] rounded-2xl border border-white/10 bg-[#23252b]/95 p-1.5 shadow-2xl backdrop-blur">
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/5"
                  onClick={() => onRenameAlbum(folder)}
                >
                  Đổi tên
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-white/5"
                  onClick={() => onDeleteAlbum(folder)}
                >
                  Xóa album
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
