"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full bg-surface-2 text-ink",
      "border border-border rounded-button px-3.5 py-3",
      "text-body focus:border-accent",
      "disabled:opacity-50",
      "appearance-none bg-[length:14px] bg-[right_14px_center] bg-no-repeat pr-10",
      // chevron via inline svg
      "bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%23a1a1aa%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22/%3E%3C/svg%3E')]",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
