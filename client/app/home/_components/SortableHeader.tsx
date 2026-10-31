"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface SortableHeaderProps {
  label: string;
  column: string;
  active: boolean;
  direction: "asc" | "desc";
  onSort: (column: string) => void;
  // Text alignment of the column the header belongs to
  align?: "left" | "center" | "right";
}

// A clickable column header. Clicking cycles asc → desc → default, and
// the chevron shows which state the column is in.
const SortableHeader = ({
  label,
  column,
  active,
  direction,
  onSort,
  align = "left",
}: SortableHeaderProps) => {
  const justify =
    align === "center"
      ? "justify-center"
      : align === "right"
        ? "justify-end"
        : "justify-start";

  const Chevron = !active
    ? ArrowUpDown
    : direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`w-full flex items-center gap-1 ${justify} font-semibold text-sm uppercase tracking-wide ${
        active ? "text-neutral-800" : "text-neutral-500 hover:text-neutral-700"
      } transition-colors cursor-pointer select-none`}
      aria-label={`Sort by ${label}`}
      title={
        active
          ? direction === "asc"
            ? `Sorted ascending — click for descending`
            : `Sorted descending — click to reset`
          : `Sort by ${label}`
      }
    >
      <span>{label}</span>
      <Chevron
        size={13}
        className={active ? "text-neutral-800" : "text-neutral-300"}
      />
    </button>
  );
};

export default SortableHeader;
