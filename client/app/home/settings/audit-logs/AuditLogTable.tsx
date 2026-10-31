"use client";

import { AuditLogProps } from "@/services/audit.service";
import { Search } from "lucide-react";
import { formatDate } from "@/utils/date.helper";

interface TableProps {
  isLoading: boolean;
  logs: AuditLogProps[];
  // Search box lives in the table header
  searchInput: string;
  setSearchInput: (value: string) => void;
}

const AuditLogTable = ({
  isLoading,
  logs,
  searchInput,
  setSearchInput,
}: TableProps) => {
  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      {/* Header with search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Audit Logs</h3>

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
              placeholder="Search actor, action or entity..."
              aria-label="Search audit logs"
              className="w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1.2fr_1.5fr_0.8fr_0.9fr_2.5fr] gap-2 border-b border-neutral-300 pb-2 px-2">
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          When
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Actor
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Action
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Entity
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Summary
        </h5>
      </div>

      {/* Rows */}
      {isLoading ? (
        <p className="text-center text-neutral-400 py-8 text-sm">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">
          No audit records found.
        </p>
      ) : (
        logs.map((log) => (
          <div
            key={log.audit_id}
            className="grid grid-cols-[1.2fr_1.5fr_0.8fr_0.9fr_2.5fr] gap-2 items-start py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
          >
            <p className="text-left text-neutral-700 whitespace-nowrap text-sm">
              {formatDate(log.created_at)}
            </p>
            <div className="text-left min-w-0">
              <p className="text-neutral-800 truncate text-sm font-medium">
                {log.actor_name || "Unknown user"}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {log.actor_id || "system"}
              </p>
            </div>
            <p className="text-left">
              <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700">
                {log.action}
              </span>
            </p>
            <p className="text-left text-neutral-700 text-sm whitespace-nowrap">
              {log.entity_type}
            </p>
            <p className="text-left text-neutral-700 text-sm">
              <span className="block max-w-xl">
                {log.summary || "No summary provided"}
              </span>
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default AuditLogTable;
