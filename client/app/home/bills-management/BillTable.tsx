"use client";

import { BillDataProps, BillFormDataProps } from "@/services/bill.service";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface TableProps {
  isLoading: boolean;
  bills: BillDataProps[];
  openAddModal: () => void;
  openEditModal: (bill: BillDataProps) => void;
  handleDelete: (bill: BillDataProps) => void;
}

const BillTable = ({
  isLoading,
  bills,
  openAddModal,
  openEditModal,
  handleDelete,
}: TableProps) => {
  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Bills</h3>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-neutral-700 transition-colors"
        >
          <Plus size={16} />
          Add Bill
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 border-b border-neutral-300 pb-2 px-2">
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Bill Name
        </h5>
        <h5 className="text-center font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Due Date
        </h5>
        <h5 className="text-center font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Amount
        </h5>
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
            className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
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
            <div className="flex justify-end gap-1 w-20">
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
