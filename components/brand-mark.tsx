import { cn } from "@/lib/utils";

export function BrandMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {/* notebook page */}
      <rect x="5" y="4" width="19" height="24" rx="2" className="fill-card stroke-thread" strokeWidth="1.6" />
      {/* spine */}
      <rect x="5" y="4" width="4" height="24" rx="1.5" className="fill-thread" />
      {/* stitched thread weaving across the page */}
      <path
        d="M12 10 Q16 8 20 10 Q24 12 20 14 Q16 16 20 18 Q24 20 20 22"
        className="stroke-manila"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="2.4 2.6"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-xl font-semibold tracking-tight", className)}>
      Note<span className="text-thread">loom</span>
    </span>
  );
}
