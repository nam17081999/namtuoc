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
    setFeedback("\u0110\u00e3 t\u1ea1o album.");
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFeedback("\u0110ang t\u1ea3i \u1ea3nh...");

    for (const file of Array.from(files)) {
      // eslint-disable-next-line no-await-in-loop
      await uploadPhoto.mutateAsync({ file, folderId: null });
    }

    setFeedback("\u0110\u00e3 t\u1ea3i \u1ea3nh.");
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
    setFeedback("\u0110\u00e3 chuy\u1ec3n \u1ea3nh.");
  };

  const handleDeletePhoto = async (photo: PhotoItem) => {
    const confirmed = window.confirm("X\u00f3a \u1ea3nh n\u00e0y?");
    if (!confirmed) return;
    await deletePhoto.mutateAsync({ id: photo.id, file_path: photo.file_path });
    setSelectedPhoto((current) => (current?.id === photo.id ? null : current));
    setFeedback("\u0110\u00e3 x\u00f3a \u1ea3nh.");
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setFeedback("\u0110\u00e3 sao ch\u00e9p \u0111\u01b0\u1eddng d\u1eabn \u1ea3nh.");
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
    const nextName = window.prompt("\u0110\u1ed5i t\u00ean album", currentName)?.trim();
    setOpenAlbumMenuId(null);
    if (!nextName || nextName === currentName) return;
    await renameFolder.mutateAsync({ id: folderId, name: nextName });
    setFeedback("\u0110\u00e3 \u0111\u1ed5i t\u00ean album.");
  };

  const handleDeleteAlbum = async (folderId: string, currentName: string) => {
    const confirmed = window.confirm(`X\u00f3a album "${currentName}"? \u1ea2nh b\u00ean trong s\u1ebd chuy\u1ec3n v\u1ec1 kh\u00f4ng th\u01b0 m\u1ee5c.`);
    setOpenAlbumMenuId(null);
    if (!confirmed) return;
    await deleteFolder.mutateAsync(folderId);
    setFeedback("\u0110\u00e3 x\u00f3a album.");
  };

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