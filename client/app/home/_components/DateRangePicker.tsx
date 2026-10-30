"use client";

import {
  RANGE_PRESETS,
  RangePreset,
} from "@/services/dashboard.service";
import { CalendarDays, RefreshCw } from "lucide-react";

interface DateRangePickerProps {
  from: string;
  to: string;
  preset: RangePreset | "CUSTOM";
  isLoading: boolean;
  onPresetChange: (preset: RangePreset) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onRefresh: () => void;
}

// Lets the user narrow the dashboard down to a date window: either one of
// the quick presets or an explicit from/to pair.
const DateRangePicker = ({
  from,
  to,
  preset,
  isLoading,
  onPresetChange,
  onFromChange,
  onToChange,
  onRefresh,
}: DateRangePickerProps) => {
  return (
    <div className="w-full mx-auto p-4 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Presets */}
        <div>
          <h5 className="font-semibold text-sm text-neutral-500 uppercase tracking-wide mb-2">
            Period
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {RANGE_PRESETS.map((option) => (
              <button
                key={option.label}
                onClick={() => onPresetChange(option.label)}
                disabled={isLoading}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  preset === option.label
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom range */}
        <div>
          <h5 className="font-semibold text-sm text-neutral-500 uppercase tracking-wide mb-2">
            Custom Range
          </h5>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-neutral-300 px-2.5 py-1.5">
              <CalendarDays size={15} className="text-neutral-400" />
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => onFromChange(e.target.value)}
                aria-label="Start date"
                className="text-sm text-neutral-700 outline-none bg-transparent"
              />
            </div>
            <span className="text-neutral-400 text-sm">to</span>
            <div className="flex items-center gap-2 rounded-lg border border-neutral-300 px-2.5 py-1.5">
              <CalendarDays size={15} className="text-neutral-400" />
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => onToChange(e.target.value)}
                aria-label="End date"
                className="text-sm text-neutral-700 outline-none bg-transparent"
              />
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-700 text-sm font-medium px-3 py-2 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
