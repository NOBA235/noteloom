import * as React from "react";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tone?: "thread" | "manila" }
>(({ className, tone = "thread", children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
      tone === "thread" ? "bg-thread" : "bg-manila text-ink",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Avatar.displayName = "Avatar";

export { Avatar };
