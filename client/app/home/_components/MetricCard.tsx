"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  // Short supporting line under the value
  hint?: ReactNode;
  // Tailwind text colour for the icon chip
  accent?: string;
  loading?: boolean;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  hint,
  accent = "text-neutral-700 bg-neutral-100",
  loading = false,
}: MetricCardProps) => {
  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
            {title}
          </h5>
          {loading ? (
            <div className="mt-2 h-7 w-28 rounded bg-neutral-100 animate-pulse" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-neutral-800 truncate">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1 text-xs text-neutral-500">{hint}</p>
          )}
        </div>
        <div className={`shrink-0 rounded-lg p-2 ${accent}`} aria-hidden="true">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
