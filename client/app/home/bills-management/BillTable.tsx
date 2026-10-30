"use client";

import { BillDataProps } from "@/services/bill.service";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { UseSortableColumnsResult } from "@/hooks/useSortableColumns";
import SortableHeader from "../_components/SortableHeader";

interface TableProps {
  isLoading: boolean;
  bills: BillDataProps[];
  openAddModal: () => void;
  openEditModal: (bill: BillDataProps) => void;
  handleDelete: (bill: BillDataProps) => void;
  openDetailsModal: (bill: BillDataProps) => void;
  // Search box lives in the table header
  searchInput: string;
  setSearchInput: (value: string) => void;
  // Column sorting lives in the table headers
  sortable: UseSortableColumnsResult;
}

const BillTable = ({
  isLoading,
  bills,
  openAddModal,
  openEditModal,
  handleDelete,
  openDetailsModal,
  searchInput,
  setSearchInput,
  sortable,
}: TableProps) => {
  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      {/* Header with search and Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Bills</h3>

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
              placeholder="Search bills by name..."
              aria-label="Search bills"
              className="w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-neutral-700 transition-colors shrink-0"
          >
            <Plus size={16} />
            Add Bill
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 border-b border-neutral-300 pb-2 px-2">
        <SortableHeader
          label="Bill Name"
          column="name"
          active={sortable.isSorted("name")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
        />
        <SortableHeader
          label="Due Date"
          column="due_date"
          active={sortable.isSorted("due_date")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
          align="center"
        />
        <SortableHeader
          label="Amount"
          column="amount"
          active={sortable.isSorted("amount")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
          align="center"
        />
        <h5 className="text-right font-semibold text-sm text-neutral-500 uppercase tracking-wide w-20">
          Actions
        </h5>
      </div>

      {/* Rows */}
      {isLoading ? (
        <p className="text-center text-neutral-400 py-8 text-sm">Loading...</p>
      ) : bills.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">
          No bills yet. Click &quot;Add Bill&quot; to get started.
        </p>
      ) : (
        bills.map((bill) => (
          <div
            key={bill.bill_id}
            role="button"
            tabIndex={0}
            onClick={() => openDetailsModal(bill)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDetailsModal(bill);
              }
            }}
            className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer focus:outline-none focus-visible:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-400"
          >
            <p className="text-left text-neutral-800">{bill.name}</p>
            <p className="text-center text-neutral-600">{bill.due_date}</p>
            <p className="text-center text-neutral-600">
              ₱
              {Number(bill.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div
              className="flex justify-end gap-1 w-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => openEditModal(bill)}
                className="p-1.5 rounded-md text-neutral-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                aria-label={`Edit ${bill.name}`}
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(bill)}
                className="p-1.5 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label={`Delete ${bill.name}`}
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

export default BillTable;
