"use client";

import { ExpenseDataProps } from "@/services/expense.service";
import { Plus, Search, Trash2 } from "lucide-react";
import { UseSortableColumnsResult } from "@/hooks/useSortableColumns";
import { formatDate } from "@/utils/date.helper";
import SortableHeader from "../_components/SortableHeader";

interface TableProps {
  isLoading: boolean;
  expenses: ExpenseDataProps[];
  openAddModal: () => void;
  handleDelete: (expense: ExpenseDataProps) => void;
  // Search box lives in the table header
  searchInput: string;
  setSearchInput: (value: string) => void;
  // Column sorting lives in the table headers
  sortable: UseSortableColumnsResult;
}

const ExpenseTable = ({
  isLoading,
  expenses,
  openAddModal,
  handleDelete,
  searchInput,
  setSearchInput,
  sortable,
}: TableProps) => {
  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      {/* Header with search and Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Expenses</h3>

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
              placeholder="Search reason or recorder..."
              aria-label="Search expenses"
              className="w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-neutral-700 transition-colors shrink-0"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1.5fr_auto] gap-2 border-b border-neutral-300 pb-2 px-2">
        <SortableHeader
          label="Reason"
          column="reason"
          active={sortable.isSorted("reason")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
        />
        <SortableHeader
          label="Amount"
          column="amount"
          active={sortable.isSorted("amount")}
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
          align="center"
        />
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Description
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
      ) : expenses.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">
          No expenses yet. Click &quot;Add Expense&quot; to get started.
        </p>
      ) : (
        expenses.map((expense) => (
          <div
            key={expense.expense_id}
            className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1.5fr_auto] gap-2 items-center py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
          >
            <p className="text-left text-neutral-800 truncate">
              {expense.reason}
            </p>
            <p className="text-center text-neutral-800">
              ₱
              {Number(expense.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-center text-neutral-600">
              {expense.occurred_at ? formatDate(expense.occurred_at) : "—"}
            </p>
            <p className="text-left text-neutral-600 truncate">
              {expense.description || "—"}
            </p>
            <p className="text-left text-neutral-600 truncate">
              {expense.recorded_by_name || expense.recorded_by_email || "—"}
            </p>
            <div className="flex justify-end gap-1 w-20">
              <button
                onClick={() => handleDelete(expense)}
                className="p-1.5 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label={`Delete ${expense.reason} expense`}
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

export default ExpenseTable;
