"use client";

import { PaymentDataProps } from "@/services/payment.service";
import { BuildingDataProps } from "@/services/building.service";
import { UserDataProps } from "@/services/user.service";
import { formatDate } from "@/utils/date.helper";
import { Plus, Search, Trash2 } from "lucide-react";
import { UseSortableColumnsResult } from "@/hooks/useSortableColumns";
import SortableHeader from "../_components/SortableHeader";

interface TableProps {
  isLoading: boolean;
  payments: PaymentDataProps[];
  buildings: BuildingDataProps[];
  unitOwners: UserDataProps[];
  openAddModal: () => void;
  handleDelete: (payment: PaymentDataProps) => void;
  // Search box lives in the table header
  searchInput: string;
  setSearchInput: (value: string) => void;
  // Column sorting lives in the table headers
  sortable: UseSortableColumnsResult;
}

const PaymentTable = ({
  isLoading,
  payments,
  buildings,
  unitOwners,
  openAddModal,
  handleDelete,
  searchInput,
  setSearchInput,
  sortable,
}: TableProps) => {
  // Payments store the payer's unit number — look the owner up to show
  // their building and name.
  const getOwner = (unitNumber: string | null) =>
    unitOwners.find((o) => o.unit_number === unitNumber);

  const getBuildingName = (buildingId: number | null) => {
    if (!buildingId) return "—";
    return buildings.find((b) => b.building_id === buildingId)?.name ?? "—";
  };

  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      {/* Header with search and Add button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">
          Payment History
        </h3>

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
              placeholder="Search unit, bill or recorder..."
              aria-label="Search payments"
              className="w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-neutral-700 transition-colors shrink-0"
          >
            <Plus size={16} />
            Record Payment
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1.5fr_1fr_auto] gap-2 border-b border-neutral-300 pb-2 px-2">
        <SortableHeader
          label="Unit No."
          column="unit_number"
          active={sortable.isSorted("unit_number")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
        />
        <SortableHeader
          label="For"
          column="bill_name"
          active={sortable.isSorted("bill_name")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
        />
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Building
        </h5>
        <SortableHeader
          label="Amount"
          column="amount"
          active={sortable.isSorted("amount")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
          align="center"
        />
        <SortableHeader
          label="Recorded By"
          column="recorded_by_name"
          active={sortable.isSorted("recorded_by_name")}
          direction={sortable.sort.direction}
          onSort={sortable.toggleSort}
        />
        <SortableHeader
          label="Paid At"
          column="paid_at"
          active={sortable.isSorted("paid_at")}
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
      ) : payments.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">
          No payments yet. Click &quot;Record Payment&quot; to get started.
        </p>
      ) : (
        payments.map((payment) => {
          const owner = getOwner(payment.unit_number);

          return (
            <div
              key={payment.payment_id}
              className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1.5fr_1fr_auto] gap-2 items-center py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <p className="text-left text-neutral-800 truncate">
                {payment.unit_number ?? "—"}
              </p>
              <p className="text-left text-neutral-800 truncate">
                {payment.bill_name ?? "—"}
              </p>
              <p className="text-left text-neutral-600 truncate">
                {getBuildingName(owner?.building ?? null)}
              </p>
              <p className="text-center text-neutral-800">
                ₱
                {Number(payment.amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-left text-neutral-600 truncate">
                {payment.recorded_by_name || payment.recorded_by_email || "—"}
              </p>
              <p className="text-center text-neutral-600">
                {payment.paid_at ? formatDate(payment.paid_at) : "—"}
              </p>
              <div className="flex justify-end gap-1 w-20">
                <button
                  onClick={() => handleDelete(payment)}
                  className="p-1.5 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label={`Delete payment for ${payment.bill_name ?? "bill"}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PaymentTable;
