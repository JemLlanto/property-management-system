"use client";

import {
  BillOwnersReportProps,
  getBillOwnersReport,
} from "@/services/payment.service";
import { BuildingDataProps } from "@/services/building.service";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface ModalProps {
  billId: number;
  buildings: BuildingDataProps[];
  onClose: () => void;
}

const BillDetailsModal = ({ billId, buildings, onClose }: ModalProps) => {
  const [report, setReport] = useState<BillOwnersReportProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      try {
        const response = await getBillOwnersReport(billId);

        if (!cancelled && response.success) {
          setReport(response.report);
        }
      } catch (err) {
        console.error("Error loading bill report: ", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [billId]);

  // Search by unit number or name; default order comes from the server
  // (most misses first, then unit number)
  const owners = useMemo(() => {
    const all = report?.owners ?? [];
    const q = query.trim().toLowerCase();

    if (!q) return all;

    return all.filter(
      (o) =>
        (o.unit_number ?? "").toLowerCase().includes(q) ||
        (o.name ?? "").toLowerCase().includes(q),
    );
  }, [report, query]);

  const getBuildingName = (buildingId: number | null) => {
    if (!buildingId) return "—";
    return buildings.find((b) => b.building_id === buildingId)?.name ?? "—";
  };

  const totalMissed = (report?.owners ?? []).reduce(
    (sum, o) => sum + o.missed_count,
    0,
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold text-neutral-800 mb-1 pr-8">
          {report?.bill_name ?? "Bill"} — Payment Standing
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          {report
            ? `${report.due_date} cycle · ₱${Number(
                report.amount,
              ).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} · ${totalMissed} missed payment${
                totalMissed === 1 ? "" : "s"
              } across all units`
            : "Loading..."}
        </p>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 mb-3">
          <Search size={15} className="text-neutral-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm outline-none"
            placeholder="Search unit number or name..."
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-center text-neutral-400 py-8 text-sm">
            Loading...
          </p>
        ) : owners.length === 0 ? (
          <p className="text-center text-neutral-400 py-8 text-sm">
            {report && report.owners.length > 0
              ? "No unit owners match your search."
              : "No unit owners found."}
          </p>
        ) : (
          <div className="overflow-y-auto border border-neutral-200 rounded-lg">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1.5fr_1.5fr_0.8fr_0.8fr] gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2 sticky top-0">
              <h5 className="text-left font-semibold text-xs text-neutral-500 uppercase tracking-wide">
                Unit No.
              </h5>
              <h5 className="text-left font-semibold text-xs text-neutral-500 uppercase tracking-wide">
                Name
              </h5>
              <h5 className="text-left font-semibold text-xs text-neutral-500 uppercase tracking-wide">
                Building
              </h5>
              <h5 className="text-center font-semibold text-xs text-neutral-500 uppercase tracking-wide">
                Paid
              </h5>
              <h5 className="text-center font-semibold text-xs text-neutral-500 uppercase tracking-wide">
                Missed
              </h5>
            </div>

            {owners.map((owner) => (
              <div
                key={owner.user_id}
                className="grid grid-cols-[1fr_1.5fr_1.5fr_0.8fr_0.8fr] gap-2 items-center px-3 py-2.5 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors"
              >
                <p className="text-left text-sm text-neutral-800 truncate">
                  {owner.unit_number ?? "—"}
                </p>
                <p className="text-left text-sm text-neutral-800 truncate">
                  {owner.name || <span className="text-neutral-400">—</span>}
                </p>
                <p className="text-left text-sm text-neutral-600 truncate">
                  {getBuildingName(owner.building)}
                </p>
                <p className="text-center text-sm text-neutral-600">
                  {owner.paid_count}/{owner.occurrences}
                </p>
                <p className="text-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      owner.missed_count > 0
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {owner.missed_count}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium py-2 hover:bg-neutral-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillDetailsModal;
