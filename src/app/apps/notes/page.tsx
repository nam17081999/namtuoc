"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { Folder, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { useCreateFolder, useFolders } from "@/modules/notes/hooks";

export default function NotesPage() {
  const { data: folders = [] } = useFolders();
  const createFolder = useCreateFolder();
  const [creating, setCreating] = useState(false);

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
            <Link
              key={folder.id}
              href={`/apps/notes/folder/${folder.id}`}
              className="icloud-list-item flex items-center justify-between rounded-xl px-3 py-3 text-sm text-white"
            >
              <span className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-amber-300" />
                {folder.name}
              </span>
              <MoreHorizontal className="h-4 w-4 text-muted" />
            </Link>
          ))}

          <div className="icloud-list-item flex items-center justify-between rounded-xl px-3 py-3 text-sm text-muted">
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-amber-300" />
              Đã xóa gần đây
            </span>
          </div>
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
