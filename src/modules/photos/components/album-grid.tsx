"use client";

import { MoreHorizontal } from "lucide-react";
import type { PhotoFolder } from "../types";

interface AlbumGridProps {
  folders: PhotoFolder[];
  photoCountByFolderId: Map<string, number>;
  openAlbumMenuId: string | null;
  onToggleMenu: (folderId: string | null) => void;
  onRenameAlbum: (folder: PhotoFolder) => void;
  onDeleteAlbum: (folder: PhotoFolder) => void;
}

export function AlbumGrid({
  folders,
  photoCountByFolderId,
  openAlbumMenuId,
  onToggleMenu,
  onRenameAlbum,
  onDeleteAlbum
}: AlbumGridProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {folders.map((folder) => (
          <div key={folder.id} className="relative rounded-2xl bg-card/70 p-3 ring-1 ring-border/40">
            <div className="mb-8">
              <div className="mb-3 aspect-square rounded-2xl bg-background/70" />
              <p className="truncate text-sm font-medium text-text">{folder.name}</p>
              <p className="text-[11px] text-muted">{photoCountByFolderId.get(folder.id) ?? 0} ảnh</p>
            </div>
            <button
              type="button"
              aria-label={`Tùy chọn cho album ${folder.name}`}
              className="absolute right-2 top-2 rounded-full p-1 text-muted transition hover:bg-white/5 hover:text-white"
              onClick={() => onToggleMenu(openAlbumMenuId === folder.id ? null : folder.id)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {openAlbumMenuId === folder.id ? (
              <div className="absolute right-2 top-10 z-20 min-w-[140px] rounded-2xl border border-white/10 bg-[#23252b] p-1.5 shadow-xl">
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
          </div>
        ))}
      </div>

      {folders.length === 0 ? (
        <div className="rounded-3xl bg-card/70 p-8 text-center text-sm text-muted ring-1 ring-border/40">
          Chưa có album nào.
        </div>
      ) : null}
    </>
  );
}
