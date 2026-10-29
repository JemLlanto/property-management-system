"use client";

import { PaymentDataProps } from "@/services/payment.service";
import { BuildingDataProps } from "@/services/building.service";
import { UserDataProps } from "@/services/user.service";
import { formatDate } from "@/utils/date.helper";
import { Plus, Trash2 } from "lucide-react";

interface TableProps {
  isLoading: boolean;
  payments: PaymentDataProps[];
  buildings: BuildingDataProps[];
  unitOwners: UserDataProps[];
  openAddModal: () => void;
  handleDelete: (payment: PaymentDataProps) => void;
}

const PaymentTable = ({
  isLoading,
  payments,
  buildings,
  unitOwners,
  openAddModal,
  handleDelete,
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
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">
          Payment History
        </h3>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-neutral-700 transition-colors"
        >
          <Plus size={16} />
          Record Payment
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_1.5fr_1fr_auto] gap-2 border-b border-neutral-300 pb-2 px-2">
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Unit No.
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          For
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Building
        </h5>
        <h5 className="text-center font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Amount
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Recorded By
        </h5>
        <h5 className="text-center font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Paid At
        </h5>
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
