"use client";

import { ViolationDataProps } from "@/services/violation.service";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { UseSortableColumnsResult } from "@/hooks/useSortableColumns";
import { formatDate } from "@/utils/date.helper";
import SortableHeader from "../_components/SortableHeader";

// Severity badge colours, shared by the header count pills and rows.
const SEVERITY_STYLES: Record<string, string> = {
  Minor: "bg-neutral-100 text-neutral-700",
  Major: "bg-amber-100 text-amber-700",
  Critical: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-700",
  Resolved: "bg-emerald-100 text-emerald-700",
};

interface TableProps {
  isLoading: boolean;
  violations: ViolationDataProps[];
  openAddModal: () => void;
  openEditModal: (violation: ViolationDataProps) => void;
  handleDelete: (violation: ViolationDataProps) => void;
  // Search box lives in the table header
  searchInput: string;
  setSearchInput: (value: string) => void;
  // Column sorting lives in the table headers
  sortable: UseSortableColumnsResult;
  // Filter pills
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

const ViolationTable = ({
  isLoading,
  violations,
  openAddModal,
  openEditModal,
  handleDelete,
  searchInput,
  setSearchInput,
  sortable,
  statusFilter,
  setStatusFilter,
}: TableProps) => {
  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      {/* Header with search and Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Violations</h3>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search unit, type or details..."
              aria-label="Search violations"
              className="w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-neutral-700 transition-colors shrink-0"
          >
            <Plus size={16} />
            Record Violation
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {["", "Open", "Resolved"].map((value) => (
          <button
            key={value || "all"}
            onClick={() => setStatusFilter(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === value
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {value || "All"}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[0.9fr_1.3fr_0.8fr_0.8fr_1.2fr_2fr_1.2fr_auto] gap-2 border-b border-neutral-300 pb-2 px-2">
        <SortableHeader
          label="Unit"
          column="unit_number"
          active={sortable.isSorted("unit_number")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
        />
        <SortableHeader
          label="Type"
          column="violation_type"
          active={sortable.isSorted("violation_type")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
        />
        <SortableHeader
          label="Severity"
          column="severity"
          active={sortable.isSorted("severity")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
          align="center"
        />
        <SortableHeader
          label="Status"
          column="status"
          active={sortable.isSorted("status")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
          align="center"
        />
        <SortableHeader
          label="Date"
          column="occurred_at"
          active={sortable.isSorted("occurred_at")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
        />
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Details
        </h5>
        <SortableHeader
          label="Recorded By"
          column="recorded_by_name"
          active={sortable.isSorted("recorded_by_name")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
        />
        <h5 className="text-right font-semibold text-sm text-neutral-500 uppercase tracking-wide w-20">
          Actions
        </h5>
      </div>

      {/* Rows */}
      {isLoading ? (
        <p className="text-center text-neutral-400 py-8 text-sm">Loading...</p>
      ) : violations.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">
          No violations recorded. Click &quot;Record Violation&quot; to add
          one.
        </p>
      ) : (
        violations.map((violation) => (
          <div
            key={violation.violation_id}
            className="grid grid-cols-[0.9fr_1.3fr_0.8fr_0.8fr_1.2fr_2fr_1.2fr_auto] gap-2 items-center py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
          >
            <p className="text-left text-neutral-800 font-medium truncate">
              {violation.unit_number}
            </p>
            <p className="text-left text-neutral-800 truncate">
              {violation.violation_type}
            </p>
            <p className="text-center">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[violation.severity] ?? SEVERITY_STYLES.Minor}`}
              >
                {violation.severity}
              </span>
            </p>
            <p className="text-center">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[violation.status] ?? STATUS_STYLES.Open}`}
              >
                {violation.status}
              </span>
            </p>
            <p className="text-left text-neutral-600 whitespace-nowrap text-sm">
              {violation.occurred_at ? formatDate(violation.occurred_at) : "—"}
            </p>
            <p className="text-left text-neutral-600 truncate text-sm">
              {violation.description || "—"}
            </p>
            <p className="text-left text-neutral-600 truncate text-sm">
              {violation.recorded_by_name || violation.recorded_by_email || "—"}
            </p>
            <div className="flex justify-end gap-1 w-20">
              <button
                onClick={() => openEditModal(violation)}
                className="p-1.5 rounded-md text-neutral-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                aria-label={`Edit ${violation.violation_type} violation for unit ${violation.unit_number}`}
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(violation)}
                className="p-1.5 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label={`Delete ${violation.violation_type} violation for unit ${violation.unit_number}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ViolationTable;
