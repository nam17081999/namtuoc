"use client";

import { useRef } from "react";
import { FolderPlus, ImageIcon, ImagePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";

export type TabKey = "photos" | "albums";

interface PhotoShellToolbarProps {
  activeTab: TabKey;
  albumName: string;
  albumCount: number;
  feedback: string | null;
  photoCount: number;
  onTabChange: (tab: TabKey) => void;
  onAlbumNameChange: (value: string) => void;
  onCreateAlbum: () => void | Promise<void>;
  onUpload: (files: FileList | null) => void | Promise<void>;
}

export function PhotoShellToolbar({
  activeTab,
  albumName,
  albumCount,
  feedback,
  photoCount,
  onTabChange,
  onAlbumNameChange,
  onCreateAlbum,
  onUpload
}: PhotoShellToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPhotosTab = activeTab === "photos";
  const title = isPhotosTab ? "T\u1ea5t c\u1ea3 \u1ea3nh" : "Album";
  const countLabel = isPhotosTab ? `${photoCount} \u1ea3nh` : `${albumCount} album`;

  return (
    <div className="space-y-2 px-1 py-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isPhotosTab ? (
              <ImageIcon className="h-4 w-4 text-muted" />
            ) : (
              <FolderPlus className="h-4 w-4 text-muted" />
            )}
            <h1 className="text-[1.35rem] font-semibold tracking-tight text-text">{title}</h1>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">{countLabel}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            void onUpload(event.target.files);
            event.currentTarget.value = "";
          }}
        />

        {isPhotosTab ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-9 rounded-full px-3 shadow-none"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="mr-1.5 h-4 w-4" />
            {"T\u1ea3i"}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="h-9 rounded-full px-3 shadow-none"
            onClick={() => void onCreateAlbum()}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {"T\u1ea1o"}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Segmented
          options={[
            { value: "photos", label: "T\u1ea5t c\u1ea3 \u1ea3nh" },
            { value: "albums", label: "Album" }
          ]}
          value={activeTab}
          onChange={(value) => onTabChange(value as TabKey)}
          className="max-w-[250px] bg-background/60"
        />
        {feedback ? (
          <p className="text-right text-[11px] text-muted" role="status" aria-live="polite">
            {feedback}
          </p>
        ) : null}
      </div>

      {!isPhotosTab ? (
        <div className="flex gap-2 pt-1">
          <Input
            aria-label={"T\u00ean album m\u1edbi"}
            placeholder="T\u00ean album m\u1edbi"
            value={albumName}
            onChange={(event) => onAlbumNameChange(event.target.value)}
          />
          <Button
            variant="secondary"
            size="sm"
            className="h-9 rounded-full px-3 shadow-none"
            onClick={() => void onCreateAlbum()}
          >
            <FolderPlus className="mr-1.5 h-4 w-4" />
            {"T\u1ea1o"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
