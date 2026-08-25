"use client";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2, NotebookPen } from "lucide-react";
import { SubNotebook } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function SubNotebookCard({
  sub,
  notebookId,
  messageCount,
  onRename,
  onDelete,
}: {
  sub: SubNotebook;
  notebookId: string;
  messageCount: number;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative">
      <Link
        href={`/notebook/${notebookId}/sub/${sub.id}`}
        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-thread/10 text-thread">
          <NotebookPen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium leading-snug">{sub.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {messageCount > 0
              ? `${messageCount} message${messageCount === 1 ? "" : "s"} · updated ${formatRelativeTime(sub.updatedAt)}`
              : "No conversation yet"}
          </p>
        </div>
      </Link>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-card/90"
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
