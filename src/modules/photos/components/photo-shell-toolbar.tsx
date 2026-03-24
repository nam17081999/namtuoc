"use client";

import { useRef } from "react";
import { FolderPlus, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";

export type TabKey = "photos" | "albums";

interface PhotoShellToolbarProps {
  activeTab: TabKey;
  albumName: string;
  feedback: string | null;
  onTabChange: (tab: TabKey) => void;
  onAlbumNameChange: (value: string) => void;
  onCreateAlbum: () => void | Promise<void>;
  onUpload: (files: FileList | null) => void | Promise<void>;
}

export function PhotoShellToolbar({
  activeTab,
  albumName,
  feedback,
  onTabChange,
  onAlbumNameChange,
  onCreateAlbum,
  onUpload
}: PhotoShellToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-3xl bg-card/70 p-4 ring-1 ring-border/40">
      <div className="flex items-center justify-between gap-3">
        <Segmented
          options={[
            { value: "photos", label: "Tất cả ảnh" },
            { value: "albums", label: "Album" }
          ]}
          value={activeTab}
          onChange={(value) => onTabChange(value as TabKey)}
          className="max-w-[260px] bg-background/80"
        />
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
        {activeTab === "photos" ? (
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Tải ảnh
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => void onCreateAlbum()}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Tạo album
          </Button>
        )}
      </div>

      {activeTab === "albums" ? (
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Tên album mới"
            value={albumName}
            onChange={(event) => onAlbumNameChange(event.target.value)}
          />
        </div>
      ) : null}

      {feedback ? <p className="mt-3 text-[12px] text-muted">{feedback}</p> : null}
    </div>
  );
}
