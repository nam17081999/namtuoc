"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { Folder, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { useCreateFolder, useDeleteFolder, useFolders, useRenameFolder } from "@/modules/notes/hooks";

export default function NotesPage() {
  const { data: folders = [] } = useFolders();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const [creating, setCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = window.prompt("Tên thư mục mới", "Thư mục mới");
    if (!name) return;
    setCreating(true);
    try {
      await createFolder.mutateAsync(name.trim());
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (folderId: string, currentName: string) => {
    const nextName = window.prompt("Đổi tên thư mục", currentName)?.trim();
    setOpenMenuId(null);
    if (!nextName || nextName === currentName) return;
    await renameFolder.mutateAsync({ id: folderId, name: nextName });
  };

  const handleDelete = async (folderId: string, name: string) => {
    const confirmed = window.confirm(`Xóa thư mục "${name}"? Ghi chú bên trong sẽ chuyển về Tất cả iCloud.`);
    setOpenMenuId(null);
    if (!confirmed) return;
    await deleteFolder.mutateAsync(folderId);
  };

  return (
    <AuthGate>
      <div className="icloud-notes px-3 py-4 sm:px-5">
        <div className="space-y-2">
          <Link
            href="/apps/notes/folder/all"
            className="icloud-list-item flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white"
          >
            <span className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-amber-300" />
              Tất cả iCloud
            </span>
          </Link>

          {folders.map((folder) => (
            <div
              key={folder.id}
              className="icloud-list-item relative flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white"
            >
              <Link href={`/apps/notes/folder/${folder.id}`} className="flex min-w-0 flex-1 items-center gap-2 pr-3">
                <Folder className="h-4 w-4 shrink-0 text-amber-300" />
                <span className="truncate">{folder.name}</span>
              </Link>
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

          <Link
            href="/apps/notes/deleted"
            className="icloud-list-item flex items-center justify-between rounded-xl px-3 py-3 text-sm text-muted"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-amber-300" />
              Đã xóa gần đây
            </span>
          </Link>
        </div>

        <div className="mt-6">
          <Button
            variant="secondary"
            className="w-full justify-start bg-transparent text-amber-300"
            onClick={handleCreate}
            disabled={creating}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Thư Mục Mới
          </Button>
        </div>
      </div>
    </AuthGate>
  );
}
