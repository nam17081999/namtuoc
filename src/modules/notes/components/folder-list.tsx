"use client";

import { useState } from "react";
import { Folder, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { Folder as FolderType } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/core/utils/cn";
import { useCreateFolder, useDeleteFolder, useRenameFolder } from "../hooks";

interface FolderListProps {
  folders: FolderType[];
  activeFolderId: string | null;
  onSelect: (id: string | null) => void;
  onOpenDeleted?: () => void;
}

export function FolderList({ folders, activeFolderId, onSelect, onOpenDeleted }: FolderListProps) {
  const [name, setName] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createFolder.mutateAsync(name.trim());
    setName("");
  };

  const handleRename = async (folderId: string, currentName: string) => {
    const nextName = window.prompt("Đổi tên thư mục", currentName)?.trim();
    setOpenMenuId(null);
    if (!nextName || nextName === currentName) return;
    await renameFolder.mutateAsync({ id: folderId, name: nextName });
  };

  const handleDelete = async (folderId: string, currentName: string) => {
    const confirmed = window.confirm(`Xóa thư mục "${currentName}"? Ghi chú bên trong sẽ chuyển về Tất cả iCloud.`);
    setOpenMenuId(null);
    if (!confirmed) return;
    await deleteFolder.mutateAsync(folderId);
    if (activeFolderId === folderId) {
      onSelect(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Thư mục</p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={cn(
              "icloud-list-item flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
              activeFolderId === null
                ? "bg-[#3a3a40] text-white"
                : "text-muted hover:text-white"
            )}
          >
            <span className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-amber-300" />
              Tất cả iCloud
            </span>
            <MoreHorizontal className="h-4 w-4 text-muted" />
          </button>
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={cn(
                "icloud-list-item relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                activeFolderId === folder.id
                  ? "bg-[#3a3a40] text-white"
                  : "text-muted hover:text-white"
              )}
            >
              <button type="button" onClick={() => onSelect(folder.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <Folder className="h-4 w-4 shrink-0 text-amber-300" />
                <span className="truncate">{folder.name}</span>
              </button>
              <button
                type="button"
                aria-label={`Tùy chọn cho ${folder.name}`}
                className="rounded-full p-1 text-muted transition hover:bg-white/5 hover:text-white"
                onClick={() => setOpenMenuId((current) => (current === folder.id ? null : folder.id))}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {openMenuId === folder.id ? (
                <div className="absolute right-3 top-[calc(100%+4px)] z-20 min-w-[140px] rounded-2xl border border-white/10 bg-[#23252b] p-1.5 shadow-xl">
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/5"
                    onClick={() => void handleRename(folder.id, folder.name)}
                  >
                    Đổi tên
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-white/5"
                    onClick={() => void handleDelete(folder.id, folder.name)}
                  >
                    Xóa
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => onOpenDeleted?.()}
            className="icloud-list-item flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-muted transition hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-amber-300" />
              Đã xóa gần đây
            </span>
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="Tên thư mục"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button variant="secondary" className="w-full" onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thư mục mới
        </Button>
      </div>
    </div>
  );
}
