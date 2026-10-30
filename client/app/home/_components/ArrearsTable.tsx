"use client";

import { ArrearsOwnerProps } from "@/services/dashboard.service";
import { formatCurrency } from "@/utils/dashboard.helper";
import { AlertTriangle } from "lucide-react";

interface ArrearsTableProps {
  owners: ArrearsOwnerProps[];
  isLoading: boolean;
}

// The unit owners who still owe money, biggest debt first.
const ArrearsTable = ({ owners, isLoading }: ArrearsTableProps) => {
  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">
          Owners in Arrears
        </h3>
        {!isLoading && owners.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertTriangle size={14} />
            {owners.length} owner{owners.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr] gap-2 border-b border-neutral-300 pb-2 px-2">
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Unit No.
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Owner
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Building
        </h5>
        <h5 className="text-right font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Outstanding
        </h5>
      </div>

      {isLoading ? (
        <p className="text-center text-neutral-400 py-8 text-sm">Loading...</p>
      ) : owners.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">
          Every owner is settled up. Nice.
        </p>
      ) : (
        owners.map((owner) => (
          <div
            key={owner.unit_number}
            className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr] gap-2 items-center py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
          >
            <p className="text-left text-neutral-800 truncate">
              {owner.unit_number}
            </p>
            <p className="text-left text-neutral-600 truncate">
              {owner.name || owner.email || "—"}
            </p>
            <p className="text-left text-neutral-600 truncate">
              {owner.building}
            </p>
            <p className="text-right text-red-600 font-medium">
              {formatCurrency(owner.outstanding)}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default ArrearsTable;
