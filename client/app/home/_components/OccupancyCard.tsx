"use client";

import { formatPercent } from "@/utils/dashboard.helper";
import { Building2 } from "lucide-react";

interface OccupancyCardProps {
  occupancyRate: number;
  occupants: number;
  capacity: number;
  buildingCount: number;
  unitOwners: number;
  isLoading: boolean;
}

// Occupancy is a headline metric for a property manager — it shows how
// full the portfolio is and how many units are actually being billed.
const OccupancyCard = ({
  occupancyRate,
  occupants,
  capacity,
  buildingCount,
  unitOwners,
  isLoading,
}: OccupancyCardProps) => {
  const capped = Math.min(Math.max(occupancyRate, 0), 100);

  return (
    <div className="w-full mx-auto p-2 md:p-5 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm font-sans">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
            Occupancy
          </h5>
          {isLoading ? (
            <div className="mt-2 h-8 w-24 rounded bg-neutral-100 animate-pulse" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-neutral-800">
              {formatPercent(occupancyRate)}
            </p>
          )}
        </div>
        <div
          className="shrink-0 rounded-lg p-2 text-neutral-700 bg-neutral-100"
          aria-hidden="true"
        >
          <Building2 size={18} />
        </div>
      </div>

      {isLoading ? (
        <div className="h-2 w-full rounded-full bg-neutral-100 animate-pulse" />
      ) : (
        <>
          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-(--primary) transition-all"
              style={{ width: `${capped}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                {occupants}
              </p>
              <p className="text-xs text-neutral-500">Occupied</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                {capacity}
              </p>
              <p className="text-xs text-neutral-500">Capacity</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                {unitOwners}
              </p>
              <p className="text-xs text-neutral-500">Owners</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            {buildingCount} building{buildingCount === 1 ? "" : "s"} ·{" "}
            {capacity - occupants > 0
              ? `${capacity - occupants} unit${capacity - occupants === 1 ? "" : "s"} still available`
              : "All units are occupied"}
          </p>
        </>
      )}
    </div>
  );
};

export default OccupancyCard;
