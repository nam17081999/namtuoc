"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ImagePlus, MoreHorizontal } from "lucide-react";
import {
  useCreatePhotoFolder,
  useDeletePhoto,
  useDeletePhotoFolder,
  useMovePhoto,
  usePhotoFolders,
  usePhotoItems,
  useRenamePhotoFolder,
  useUploadPhoto
} from "../hooks";
import type { PhotoItem } from "../types";
import { AlbumGrid } from "./album-grid";
import { PhotoGrid } from "./photo-grid";
import { PhotoShellToolbar, type TabKey } from "./photo-shell-toolbar";
import { PhotoViewer } from "./photo-viewer";

interface PhotoShellProps {
  folderId?: string | null;
}

export function PhotoShell({ folderId = null }: PhotoShellProps = {}) {
  const router = useRouter();
  const isAlbumPage = Boolean(folderId);
  const albumUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("photos");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [albumName, setAlbumName] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [openAlbumMenuId, setOpenAlbumMenuId] = useState<string | null>(null);

  const foldersQuery = usePhotoFolders();
  const photosQuery = usePhotoItems(isAlbumPage ? folderId : null);
  const folders = foldersQuery.data ?? [];
  const photos = photosQuery.data ?? [];
  const createFolder = useCreatePhotoFolder();
  const renameFolder = useRenamePhotoFolder();
  const deleteFolder = useDeletePhotoFolder();
  const uploadPhoto = useUploadPhoto();
  const movePhoto = useMovePhoto();
  const deletePhoto = useDeletePhoto();

  const currentFolder = useMemo(
    () => (folderId ? folders.find((folder) => folder.id === folderId) ?? null : null),
    [folderId, folders]
  );

  const photoCountByFolderId = useMemo(() => {
    const map = new Map<string, number>();
    photos.forEach((photo) => {
      if (!photo.folder_id) return;
      map.set(photo.folder_id, (map.get(photo.folder_id) ?? 0) + 1);
    });
    return map;
  }, [photos]);

  const handleCreateAlbum = async () => {
    const name = albumName.trim();
    if (!name) return;
    await createFolder.mutateAsync(name);
    setAlbumName("");
    setFeedback("Đã tạo album.");
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFeedback("Đang tải ảnh...");

    for (const file of Array.from(files)) {
      // eslint-disable-next-line no-await-in-loop
      await uploadPhoto.mutateAsync({ file, folderId });
    }

    setFeedback("Đã tải ảnh.");
  };

  const handleMove = async (photoId: string, nextFolderId: string) => {
    await movePhoto.mutateAsync({
      photoId,
      folderId: nextFolderId === "unfiled" ? null : nextFolderId
    });
    setSelectedPhoto((current) =>
      current && current.id === photoId
        ? { ...current, folder_id: nextFolderId === "unfiled" ? null : nextFolderId }
        : current
    );
    setFeedback("Đã chuyển ảnh.");
  };

  const handleDeletePhoto = async (photo: PhotoItem) => {
    const confirmed = window.confirm("Xóa ảnh này?");
    if (!confirmed) return;
    await deletePhoto.mutateAsync({ id: photo.id, file_path: photo.file_path });
    setSelectedPhoto((current) => (current?.id === photo.id ? null : current));
    setFeedback("Đã xóa ảnh.");
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setFeedback("Đã sao chép đường dẫn ảnh.");
  };

  const handleShare = async (photo: PhotoItem) => {
    if (navigator.share) {
      await navigator.share({
        title: photo.file_name,
        url: photo.public_url
      });
      return;
    }

    await handleCopyUrl(photo.public_url);
  };

  const handleRenameAlbum = async (nextFolderId: string, currentName: string) => {
    const nextName = window.prompt("Đổi tên album", currentName)?.trim();
    setOpenAlbumMenuId(null);
    if (!nextName || nextName === currentName) return;
    await renameFolder.mutateAsync({ id: nextFolderId, name: nextName });
    setFeedback("Đã đổi tên album.");
  };

  const handleDeleteAlbum = async (nextFolderId: string, currentName: string) => {
    const confirmed = window.confirm(`Xóa album "${currentName}"? Ảnh bên trong sẽ chuyển về không thư mục.`);
    setOpenAlbumMenuId(null);
    if (!confirmed) return;
    await deleteFolder.mutateAsync(nextFolderId);
    setFeedback("Đã xóa album.");

    if (folderId === nextFolderId) {
      router.push("/apps/photos");
    }
  };

  if (isAlbumPage) {
    const isMissingAlbum = !foldersQuery.isLoading && !currentFolder;
    const hasAlbumError = foldersQuery.isError || photosQuery.isError;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-[28px] bg-card/70 px-4 py-3 ring-1 ring-border/40">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={"/apps/photos" satisfies Route}
              aria-label="Quay lại Ảnh"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/70 text-text transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-text">{currentFolder?.name ?? "Album"}</p>
              <p className="text-[11px] text-muted">{photos.length} ảnh</p>
            </div>
          </div>

          {currentFolder ? (
            <div className="flex items-center gap-2">
              <input
                ref={albumUploadInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void handleUpload(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                aria-label="Tải ảnh vào album"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/70 text-text transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0"
                onClick={() => albumUploadInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  aria-label={`Tùy chọn cho album ${currentFolder.name}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/70 text-muted transition hover:bg-background hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0"
                  onClick={() => setOpenAlbumMenuId(openAlbumMenuId === currentFolder.id ? null : currentFolder.id)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openAlbumMenuId === currentFolder.id ? (
                  <div className="absolute right-0 top-12 z-20 min-w-[150px] rounded-2xl border border-white/10 bg-[#23252b] p-1.5 shadow-xl">
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/5"
                      onClick={() => void handleRenameAlbum(currentFolder.id, currentFolder.name)}
                    >
                      Đổi tên
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-white/5"
                      onClick={() => void handleDeleteAlbum(currentFolder.id, currentFolder.name)}
                    >
                      Xóa album
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {feedback ? (
          <p className="px-1 text-right text-[11px] text-muted" role="status" aria-live="polite">
            {feedback}
          </p>
        ) : null}

        {foldersQuery.isLoading || photosQuery.isLoading ? (
          <div className="rounded-3xl bg-card/70 p-8 text-center text-sm text-muted ring-1 ring-border/40">
            Đang tải album...
          </div>
        ) : hasAlbumError ? (
          <div className="rounded-3xl bg-card/70 p-8 text-center text-sm text-muted ring-1 ring-border/40">
            Không thể tải album lúc này.
          </div>
        ) : currentFolder ? (
          <PhotoGrid photos={photos} onOpenPhoto={setSelectedPhoto} />
        ) : isMissingAlbum ? (
          <div className="rounded-3xl bg-card/70 p-8 text-center text-sm text-muted ring-1 ring-border/40">
            Album này không còn tồn tại.
          </div>
        ) : null}

        <PhotoViewer
          photo={selectedPhoto}
          folders={folders}
          onClose={() => setSelectedPhoto(null)}
          onMove={handleMove}
          onDelete={handleDeletePhoto}
          onShare={handleShare}
          onCopyUrl={handleCopyUrl}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PhotoShellToolbar
        activeTab={activeTab}
        albumName={albumName}
        albumCount={folders.length}
        feedback={feedback}
        photoCount={photos.length}
        onTabChange={setActiveTab}
        onAlbumNameChange={setAlbumName}
        onCreateAlbum={handleCreateAlbum}
        onUpload={handleUpload}
      />

      {activeTab === "photos" ? (
        <PhotoGrid photos={photos} onOpenPhoto={setSelectedPhoto} />
      ) : (
        <AlbumGrid
          folders={folders}
          photoCountByFolderId={photoCountByFolderId}
          getAlbumHref={(nextFolderId) => `/apps/photos/album/${nextFolderId}` as Route}
          openAlbumMenuId={openAlbumMenuId}
          onToggleMenu={setOpenAlbumMenuId}
          onRenameAlbum={(folder) => void handleRenameAlbum(folder.id, folder.name)}
          onDeleteAlbum={(folder) => void handleDeleteAlbum(folder.id, folder.name)}
        />
      )}

      <PhotoViewer
        photo={selectedPhoto}
        folders={folders}
        onClose={() => setSelectedPhoto(null)}
        onMove={handleMove}
        onDelete={handleDeletePhoto}
        onShare={handleShare}
        onCopyUrl={handleCopyUrl}
      />
    </div>
  );
}
