import { cn } from "@/lib/utils";

export function SectionHeader({
  children,
  className,
  trailing,
}: {
  children: React.ReactNode;
  className?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <h2 className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        {children}
      </h2>
      {trailing}
    </div>
  );
}
