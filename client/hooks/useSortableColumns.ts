"use client";

import { useCallback, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState {
  // The column key currently sorted on, or null for the default order
  column: string | null;
  direction: SortDirection;
}

export interface UseSortableColumnsResult {
  sort: SortState;
  // Toggle logic for a header click:
  //   first click  → column ascending
  //   second click → column descending
  //   third click  → back to the table's default order
  toggleSort: (column: string) => void;
  // True when the given column is the active sort
  isSorted: (column: string) => boolean;
  // The query params to merge into the list fetch
  sortParams: { sort?: string; order?: SortDirection };
}

// Sorting for a server-paginated table. The sort is sent to the server
// as ?sort=<column>&order=asc|desc — the server owns the real ordering,
// since it is the only one that can sort before paging.
export function useSortableColumns(): UseSortableColumnsResult {
  const [sort, setSort] = useState<SortState>({
    column: null,
    direction: "desc",
  });

  const toggleSort = useCallback((column: string) => {
    setSort((prev) => {
      // New column → start ascending
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }

      // Same column → asc, then desc, then clear back to the default
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }

      return { column: null, direction: "desc" };
    });
  }, []);

  const isSorted = useCallback(
    (column: string) => sort.column === column,
    [sort.column],
  );

  const sortParams = useMemo(
    () => (sort.column ? { sort: sort.column, order: sort.direction } : {}),
    [sort],
  );

  return { sort, toggleSort, isSorted, sortParams };
}
