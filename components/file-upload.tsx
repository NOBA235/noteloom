"use client";
import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Trash2, Upload, Loader2 } from "lucide-react";
import { UploadedFile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  return FileText;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  files,
  uploading,
  onUpload,
  onRemove,
}: {
  files: UploadedFile[];
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onUpload(file);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-thread bg-thread/5" : "border-border"
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-thread" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <p className="mt-3 text-sm font-medium">
          {uploading ? "Reading file…" : "Drop a note here, or browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {"PDF, image, or text — added to this sub-notebook's memory"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => {
            const Icon = fileIcon(f.mimeType);
            return (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-thread/10 text-thread">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(f.size)}
                    {f.mimeType === "application/pdf" && !f.textContent
                      ? " · text not extracted"
                      : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(f.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
