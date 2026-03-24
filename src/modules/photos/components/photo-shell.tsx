"use client";

import { useMemo, useState } from "react";
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

export function PhotoShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("photos");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [albumName, setAlbumName] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [openAlbumMenuId, setOpenAlbumMenuId] = useState<string | null>(null);

  const { data: folders = [] } = usePhotoFolders();
  const { data: photos = [] } = usePhotoItems(null);
  const createFolder = useCreatePhotoFolder();
  const renameFolder = useRenamePhotoFolder();
  const deleteFolder = useDeletePhotoFolder();
  const uploadPhoto = useUploadPhoto();
  const movePhoto = useMovePhoto();
  const deletePhoto = useDeletePhoto();

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
      await uploadPhoto.mutateAsync({ file, folderId: null });
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

  const handleRenameAlbum = async (folderId: string, currentName: string) => {
    const nextName = window.prompt("Đổi tên album", currentName)?.trim();
    setOpenAlbumMenuId(null);
    if (!nextName || nextName === currentName) return;
    await renameFolder.mutateAsync({ id: folderId, name: nextName });
    setFeedback("Đã đổi tên album.");
  };

  const handleDeleteAlbum = async (folderId: string, currentName: string) => {
    const confirmed = window.confirm(`Xóa album "${currentName}"? Ảnh bên trong sẽ chuyển về không thư mục.`);
    setOpenAlbumMenuId(null);
    if (!confirmed) return;
    await deleteFolder.mutateAsync(folderId);
    setFeedback("Đã xóa album.");
  };

  return (
    <div className="space-y-4">
      <PhotoShellToolbar
        activeTab={activeTab}
        albumName={albumName}
        feedback={feedback}
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
