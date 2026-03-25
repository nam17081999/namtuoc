"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, FolderInput, Share2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PhotoFolder, PhotoItem } from "../types";

interface PhotoViewerProps {
  photo: PhotoItem | null;
  folders: PhotoFolder[];
  onClose: () => void;
  onMove: (photoId: string, nextFolderId: string) => void | Promise<void>;
  onDelete: (photo: PhotoItem) => void | Promise<void>;
  onShare: (photo: PhotoItem) => void | Promise<void>;
}

interface AlbumOption {
  id: string;
  name: string;
  description: string;
}

export function PhotoViewer({ photo, folders, onClose, onMove, onDelete, onShare }: PhotoViewerProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isAlbumPickerOpen, setIsAlbumPickerOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!photo) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!dialogRef.current) return;

      if (event.key === "Escape") {
        event.preventDefault();
        if (isAlbumPickerOpen) {
          setIsAlbumPickerOpen(false);
          return;
        }
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
  }, [isAlbumPickerOpen, onClose, photo]);

  useEffect(() => {
    if (!photo) {
      setIsAlbumPickerOpen(false);
      setIsMoving(false);
    }
  }, [photo]);

  if (!photo) return null;

  const currentFolderId = photo.folder_id ?? "unfiled";
  const selectedAlbumCount = currentFolderId === "unfiled" ? 0 : 1;
  const albumSummaryLabel = selectedAlbumCount === 0 ? "Chưa gắn album" : "1 album";

  const albumOptions: AlbumOption[] = [
    { id: "unfiled", name: "Không album", description: "Ảnh chưa nằm trong album nào." },
    ...folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      description: folder.id === currentFolderId ? "Album đang chọn." : "Chạm để chuyển ảnh vào album này."
    }))
  ];

  const handleMoveToAlbum = async (nextFolderId: string) => {
    if (isMoving || nextFolderId === currentFolderId) {
      setIsAlbumPickerOpen(false);
      return;
    }

    setIsMoving(true);
    try {
      await onMove(photo.id, nextFolderId);
      setIsAlbumPickerOpen(false);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh"
      tabIndex={-1}
    >
      <div className="relative flex h-full flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/80 via-black/25 to-transparent px-4 pb-10 pt-4">
          <div className="flex justify-end">
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Đóng ảnh"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-4 pt-16 sm:px-6 sm:pt-20">
          <div className="flex h-full max-h-full w-full items-center justify-center">
            <img
              src={photo.public_url}
              alt={photo.file_name}
              className="block h-auto max-h-[calc(100dvh-12.5rem)] w-auto max-w-full object-contain sm:max-h-[calc(100dvh-13.5rem)]"
            />
          </div>
        </div>

        <div className="relative z-10 px-3 pb-4 sm:px-4">
          <div className="rounded-[28px] bg-white/10 p-2 backdrop-blur-xl">
            {isAlbumPickerOpen ? (
              <div className="mb-2 rounded-[24px] bg-black/35 p-3">
                <div className="mb-3 flex items-start justify-between gap-3 px-1">
                  <div>
                    <p className="text-sm font-medium text-white">Quản lý album</p>
                    <p className="text-xs text-white/60">
                      Giao diện này giữ bố cục đồng đều hơn, không đẩy tên album dài ra nút chính.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Đóng chọn album"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                    onClick={() => setIsAlbumPickerOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-2">
                  {albumOptions.map((folder) => {
                    const isActive = folder.id === currentFolderId;

                    return (
                      <button
                        key={folder.id}
                        type="button"
                        disabled={isMoving}
                        className={[
                          "flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left transition",
                          isActive
                            ? "bg-white text-black"
                            : "bg-white/6 text-white hover:bg-white/12",
                          isMoving ? "cursor-wait opacity-70" : ""
                        ].join(" ")}
                        onClick={() => void handleMoveToAlbum(folder.id)}
                      >
                        <div
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                            isActive ? "bg-black/10 text-black" : "bg-black/20 text-white"
                          ].join(" ")}
                        >
                          <FolderInput className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{folder.name}</span>
                            {isActive ? (
                              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-current">
                                Đang chọn
                              </span>
                            ) : null}
                          </div>
                          <p className={`truncate text-xs ${isActive ? "text-black/65" : "text-white/60"}`}>
                            {folder.description}
                          </p>
                        </div>
                        {isActive ? <Check className="h-4 w-4 shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="ghost"
                className="h-12 rounded-2xl bg-white/8 text-white hover:bg-white/16 hover:text-white"
                onClick={() => void onShare(photo)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Chia sẻ
              </Button>
              <button
                type="button"
                className="flex h-12 items-center justify-center rounded-2xl bg-white/8 px-3 text-white transition hover:bg-white/16"
                aria-label="Quản lý album của ảnh"
                onClick={() => setIsAlbumPickerOpen((current) => !current)}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FolderInput className="h-4 w-4 shrink-0 text-white/70" />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-medium text-white">Album</p>
                  </div>
                </div>
              </button>
              <Button
                variant="ghost"
                className="h-12 rounded-2xl bg-white/8 text-white hover:bg-[#5a1f25] hover:text-white"
                onClick={() => void onDelete(photo)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
