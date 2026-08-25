"use client";

// IndexedDB store for uploaded files (kept separate from localStorage because
// image/PDF data URLs can be a few MB — too big to comfortably share
// localStorage with chat history).

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { UploadedFile } from "./types";

interface NoteloomDB extends DBSchema {
  files: {
    key: string;
    value: UploadedFile;
    indexes: { "by-sub": string };
  };
}

let dbPromise: Promise<IDBPDatabase<NoteloomDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("files-db can only run in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<NoteloomDB>("noteloom-files", 1, {
      upgrade(db) {
        const store = db.createObjectStore("files", { keyPath: "id" });
        store.createIndex("by-sub", "subNotebookId");
      },
    });
  }
  return dbPromise;
}

export async function addFile(file: UploadedFile): Promise<void> {
  const db = await getDB();
  await db.put("files", file);
}

export async function getFiles(subNotebookId: string): Promise<UploadedFile[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("files", "by-sub", subNotebookId);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("files", id);
}

export async function deleteFilesForSub(subNotebookId: string): Promise<void> {
  const db = await getDB();
  const files = await db.getAllFromIndex("files", "by-sub", subNotebookId);
  await Promise.all(files.map((f) => db.delete("files", f.id)));
}
