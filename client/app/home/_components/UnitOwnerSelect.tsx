"use client";

import { UserDataProps } from "@/services/user.service";
import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// Searchable dropdown for unit owners — filters by unit number, name or
// email. Shared by the payment and violation modals so both record
// against a real unit owner account.
const UnitOwnerSelect = ({
  unitOwners,
  value,
  error,
  label = "Unit No.",
  onChange,
}: {
  unitOwners: UserDataProps[];
  value: string;
  error?: string;
  label?: string;
  onChange: (owner: UserDataProps) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = unitOwners.find((o) => o.unit_number === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return unitOwners;

    return unitOwners.filter(
      (o) =>
        (o.unit_number ?? "").toLowerCase().includes(q) ||
        (o.name ?? "").toLowerCase().includes(q) ||
        (o.email ?? "").toLowerCase().includes(q),
    );
  }, [unitOwners, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-neutral-600 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-neutral-800 ${
          error ? "border-red-400" : "border-neutral-300"
        }`}
      >
        <span className={selected ? "text-neutral-800" : "text-neutral-400"}>
          {selected
            ? `${selected.unit_number ?? "—"}${
                selected.name ? ` · ${selected.name}` : ""
              }`
            : "Select a unit owner"}
        </span>
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
            <Search size={14} className="text-neutral-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm outline-none"
              placeholder="Search unit no. or name..."
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X
                  size={14}
                  className="text-neutral-400 hover:text-neutral-600"
                />
              </button>
            )}
          </div>

          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-400">
                No unit owners found
              </li>
            ) : (
              filtered.map((owner) => (
                <li key={owner.user_id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(owner);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                      owner.unit_number === value
                        ? "bg-neutral-100 font-medium"
                        : ""
                    }`}
                  >
                    <span className="text-neutral-800">
                      {owner.unit_number ?? "—"}
                    </span>
                    {owner.name && (
                      <span className="text-neutral-500"> · {owner.name}</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default UnitOwnerSelect;
