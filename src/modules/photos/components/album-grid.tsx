"use client";

import type { Route } from "next";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { PhotoFolder } from "../types";

interface AlbumGridProps {
  folders: PhotoFolder[];
  photoCountByFolderId: Map<string, number>;
  getAlbumHref: (folderId: string) => Route;
  openAlbumMenuId: string | null;
  onToggleMenu: (folderId: string | null) => void;
  onRenameAlbum: (folder: PhotoFolder) => void;
  onDeleteAlbum: (folder: PhotoFolder) => void;
}

export function AlbumGrid({
  folders,
  photoCountByFolderId,
  getAlbumHref,
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
            <Link
              href={getAlbumHref(folder.id)}
              className="mb-8 block rounded-[1.125rem] transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <div className="mb-3 aspect-square rounded-2xl bg-background/70" />
              <p className="truncate text-sm font-medium text-text">{folder.name}</p>
              <p className="text-[11px] text-muted">{photoCountByFolderId.get(folder.id) ?? 0} {"\u1ea3nh"}</p>
            </Link>
            <button
              type="button"
              aria-label={`T\u00f9y ch\u1ecdn cho album ${folder.name}`}
              className="absolute right-2 top-2 rounded-full p-1 text-muted transition hover:bg-white/5 hover:text-white"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleMenu(openAlbumMenuId === folder.id ? null : folder.id);
              }}
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
                  {"\u0110\u1ed5i t\u00ean"}
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-white/5"
                  onClick={() => onDeleteAlbum(folder)}
                >
                  {"X\u00f3a album"}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {folders.length === 0 ? (
        <div className="rounded-3xl bg-card/70 p-8 text-center text-sm text-muted ring-1 ring-border/40">
          {"Ch\u01b0a c\u00f3 album n\u00e0o."}
        </div>
      ) : null}
    </>
  );
}
