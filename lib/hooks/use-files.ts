"use client";
import { useCallback, useEffect, useState } from "react";
import { UploadedFile } from "@/lib/types";
import * as filesDb from "@/lib/files-db";
import { extractPdfText } from "@/lib/pdf";
import { uid } from "@/lib/utils";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function useFiles(subNotebookId: string) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await filesDb.getFiles(subNotebookId);
    setFiles(all);
    setLoading(false);
  }, [subNotebookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        let textContent: string | undefined;
        let dataUrl: string | undefined;

        if (file.type.startsWith("image/")) {
          dataUrl = await readFileAsDataUrl(file);
        } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          dataUrl = await readFileAsDataUrl(file);
          textContent = await extractPdfText(file);
        } else {
          // txt, md, and anything else we can reasonably read as text
          textContent = await readFileAsText(file);
        }

        const uploaded: UploadedFile = {
          id: uid("file"),
          subNotebookId,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          textContent,
          dataUrl,
          createdAt: Date.now(),
        };
        await filesDb.addFile(uploaded);
        await refresh();
        return uploaded;
      } finally {
        setUploading(false);
      }
    },
    [subNotebookId, refresh]
  );

  const removeFile = useCallback(
    async (id: string) => {
      await filesDb.deleteFile(id);
      await refresh();
    },
    [refresh]
  );

  return { files, loading, uploading, uploadFile, removeFile, refresh };
}
