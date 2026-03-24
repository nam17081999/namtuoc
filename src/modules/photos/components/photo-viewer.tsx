"use client";

import { useEffect, useRef } from "react";
import { FolderInput, Link2, Share2, Trash2, X } from "lucide-react";
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!photo) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!dialogRef.current) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, photo]);

  if (!photo) return null;

  const titleId = `photo-viewer-title-${photo.id}`;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className="relative flex h-full flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/80 via-black/25 to-transparent px-4 pb-10 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p id={titleId} className="truncate text-sm font-medium text-white">
                {photo.file_name}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label={"\u0110\u00f3ng \u1ea3nh"}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-28 pt-20 sm:px-6">
          <img src={photo.public_url} alt={photo.file_name} className="max-h-full w-full max-w-5xl object-contain" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-4 sm:px-4">
          <div className="rounded-[28px] border border-white/10 bg-white/10 p-2 backdrop-blur-xl">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="ghost"
                className="h-12 rounded-2xl bg-white/8 text-white hover:bg-white/16 hover:text-white"
                onClick={() => void onShare(photo)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                {"Chia s\u1ebb"}
              </Button>
              <div className="relative">
                <FolderInput className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <Select
                  aria-label={"Chuy\u1ec3n \u1ea3nh v\u00e0o album"}
                  value={photo.folder_id ?? "unfiled"}
                  onChange={(event) => void onMove(photo.id, event.target.value)}
                  className="h-12 rounded-2xl border-white/10 bg-white/8 pl-9 text-white shadow-none focus-visible:ring-white/30"
                >
                  <option value="unfiled">{"Kh\u00f4ng album"}</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="ghost"
                className="h-12 rounded-2xl bg-white/8 text-white hover:bg-[#5a1f25] hover:text-white"
                onClick={() => void onDelete(photo)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {"X\u00f3a"}
              </Button>
            </div>

            <div className="mt-2 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-[11px] text-white/60 hover:bg-white/10 hover:text-white"
                onClick={() => void onCopyUrl(photo.public_url)}
              >
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                {"L\u1ea5y \u0111\u01b0\u1eddng d\u1eabn \u1ea3nh"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
