"use client";

import { Link2, Share2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { PhotoFolder, PhotoItem } from "../types";

interface PhotoViewerProps {
  photo: PhotoItem | null;
  folders: PhotoFolder[];
  onClose: () => void;
  onMove: (photoId: string, nextFolderId: string) => void | Promise<void>;
  onDelete: (photo: PhotoItem) => void | Promise<void>;
  onShare: (photo: PhotoItem) => void | Promise<void>;
  onCopyUrl: (url: string) => void | Promise<void>;
}

export function PhotoViewer({ photo, folders, onClose, onMove, onDelete, onShare, onCopyUrl }: PhotoViewerProps) {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-[#111317] p-4 ring-1 ring-white/10">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{photo.file_name}</p>
            <p className="truncate text-[11px] text-muted">{photo.public_url}</p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-muted transition hover:bg-white/5 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl bg-background/70">
          <img src={photo.public_url} alt={photo.file_name} className="max-h-[70vh] w-full object-contain" />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
          <Button variant="secondary" onClick={() => void onShare(photo)}>
            <Share2 className="mr-2 h-4 w-4" />
            Chia sẻ
          </Button>
          <Select value={photo.folder_id ?? "unfiled"} onChange={(event) => void onMove(photo.id, event.target.value)}>
            <option value="unfiled">Không album</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={() => void onDelete(photo)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </Button>
        </div>

        <div className="mt-2">
          <Button variant="ghost" className="w-full" onClick={() => void onCopyUrl(photo.public_url)}>
            <Link2 className="mr-2 h-4 w-4" />
            Lấy đường dẫn ảnh
          </Button>
        </div>
      </div>
    </div>
  );
}
