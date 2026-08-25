"use client";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Notebook, NOTEBOOK_COLORS } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function NotebookCard({
  notebook,
  subCount,
  onRename,
  onDelete,
}: {
  notebook: Notebook;
  subCount: number;
  onRename: () => void;
  onDelete: () => void;
}) {
  const colorMeta = NOTEBOOK_COLORS[notebook.color];

  return (
    <div className="group relative">
      <Link
        href={`/notebook/${notebook.id}`}
        className="block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex">
          <div className={cn("w-2.5 shrink-0", colorMeta.bg)} />
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl leading-none">{notebook.emoji}</span>
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold leading-snug">
              {notebook.title}
            </h3>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {subCount} sub-notebook{subCount === 1 ? "" : "s"}
              </span>
              <span>{formatRelativeTime(notebook.updatedAt)}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-card/90 backdrop-blur"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="h-3.5 w-3.5" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem destructive onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
