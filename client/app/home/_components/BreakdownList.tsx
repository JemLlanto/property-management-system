"use client";

import { NamedAmountProps } from "@/services/dashboard.service";
import { formatCurrency, formatPercent } from "@/utils/dashboard.helper";

interface BreakdownListProps {
  title: string;
  data: NamedAmountProps[];
  isLoading: boolean;
  // Shown when there is nothing to list
  emptyText?: string;
  // Accent colour for the bars
  barClass?: string;
}

// A titled list of labelled horizontal bars — used for revenue by bill,
// revenue by building and arrears by building.
const BreakdownList = ({
  title,
  data,
  isLoading,
  emptyText = "Nothing to show for the selected period.",
  barClass = "bg-neutral-800",
}: BreakdownListProps) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const max = Math.max(...data.map((item) => item.amount), 0);

  return (
    <div className="w-full mx-auto p-2 md:p-5 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm font-sans">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
        {!isLoading && data.length > 0 && (
          <span className="text-sm text-neutral-500">
            {formatCurrency(total)}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-8 rounded bg-neutral-100 animate-pulse"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {data.map((item) => (
            <li key={item.name}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-sm text-neutral-700 truncate">
                  {item.name}
                </span>
                <span className="text-sm text-neutral-500 shrink-0">
                  {formatCurrency(item.amount)}
                  {total > 0 && (
                    <span className="ml-2 text-xs">
                      {formatPercent((item.amount / total) * 100, 0)}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barClass} transition-all`}
                  style={{
                    width: max > 0 ? `${(item.amount / max) * 100}%` : "0%",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BreakdownList;
