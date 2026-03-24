import { cn } from "@/core/utils/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={cn("flex rounded-full border border-border/70 bg-surface/70 p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-xs font-medium transition",
              active ? "bg-accent text-white" : "text-muted hover:text-text"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
