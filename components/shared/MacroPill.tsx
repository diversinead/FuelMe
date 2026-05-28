import { cn } from "@/lib/utils";

export function MacroPill({
  kind,
  value,
  className,
}: {
  kind: "carbs" | "protein";
  value: number | string;
  className?: string;
}) {
  return (
    <span className={cn("macro-pill", kind, className)}>
      <span className="opacity-70">{kind === "carbs" ? "C" : "P"}</span>
      <span>
        {value}
        {typeof value === "number" ? "g" : ""}
      </span>
    </span>
  );
}
