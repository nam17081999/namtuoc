"use client";

import { useState } from "react";
import { Folder, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { Folder as FolderType } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/core/utils/cn";
import { useCreateFolder } from "../hooks";

interface FolderListProps {
  folders: FolderType[];
  activeFolderId: string | null;
  onSelect: (id: string | null) => void;
}

export function FolderList({ folders, activeFolderId, onSelect }: FolderListProps) {
  const [name, setName] = useState("");
  const createFolder = useCreateFolder();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createFolder.mutateAsync(name.trim());
    setName("");
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
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelect(folder.id)}
              className={cn(
                "icloud-list-item flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                activeFolderId === folder.id
                  ? "bg-[#3a3a40] text-white"
                  : "text-muted hover:text-white"
              )}
            >
              <span className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-amber-300" />
                {folder.name}
              </span>
              <MoreHorizontal className="h-4 w-4 text-muted" />
            </button>
          ))}
          <div className="icloud-list-item flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-muted">
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-amber-300" />
              Đã xóa gần đây
            </span>
          </div>
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
