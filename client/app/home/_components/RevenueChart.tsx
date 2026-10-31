"use client";

import { DailyAmountProps } from "@/services/dashboard.service";
import {
  formatCompactCurrency,
  formatCurrency,
  formatShortDate,
} from "@/utils/dashboard.helper";
import { useMemo, useState } from "react";

interface RevenueChartProps {
  data: DailyAmountProps[];
  isLoading: boolean;
}

// A dependency-free SVG revenue chart: bars for each day plus a trend
// line. Hovering a bar shows the exact amount for that day.
const RevenueChart = ({ data, isLoading }: RevenueChartProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = useMemo(() => Math.max(...data.map((d) => d.amount), 0), [data]);

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.amount, 0),
    [data],
  );

  // Chart geometry — the SVG scales with the container via viewBox
  const width = 900;
  const height = 260;
  const padding = { top: 16, right: 16, bottom: 34, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Keep the bars readable when the window is long — aggregate into at
  // most ~60 buckets so a 1-year range still renders cleanly.
  const buckets = useMemo(() => {
    const maxBuckets = 60;

    if (data.length <= maxBuckets) {
      return data.map((d) => ({
        ...d,
        label: d.date,
        from: d.date,
        to: d.date,
      }));
    }

    const size = Math.ceil(data.length / maxBuckets);
    const grouped: (DailyAmountProps & {
      label: string;
      from: string;
      to: string;
    })[] = [];

    for (let i = 0; i < data.length; i += size) {
      const slice = data.slice(i, i + size);
      const amount = slice.reduce((sum, d) => sum + d.amount, 0);

      grouped.push({
        date: slice[0].date,
        amount,
        label:
          slice.length === 1
            ? slice[0].date
            : `${slice[0].date} → ${slice[slice.length - 1].date}`,
        from: slice[0].date,
        to: slice[slice.length - 1].date,
      });
    }

    return grouped;
  }, [data]);

  const barSlot = plotWidth / Math.max(buckets.length, 1);
  const barWidth = Math.max(barSlot * 0.62, 2);

  // Trend line points — one per bucket, centred on its bar
  const points = buckets
    .map((bucket, index) => {
      const x = padding.left + barSlot * index + barSlot / 2;
      const y =
        padding.top +
        plotHeight -
        (max > 0 ? (bucket.amount / max) * plotHeight : 0);

      return `${x},${y}`;
    })
    .join(" ");

  // Four horizontal gridlines with their value labels
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  if (isLoading) {
    return (
      <div className="w-full mx-auto p-2 md:p-5 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm font-sans">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          Revenue Trend
        </h3>
        <div className="h-[260px] w-full rounded bg-neutral-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-2 md:p-5 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">
          Revenue Trend
        </h3>
        <p className="text-sm text-neutral-500">
          {formatCurrency(total)} collected across {data.length} day
          {data.length === 1 ? "" : "s"}
        </p>
      </div>

      {data.length === 0 ? (
        <p className="text-center text-neutral-400 py-12 text-sm">
          No data for the selected period.
        </p>
      ) : (
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            role="img"
            aria-label="Revenue by day"
          >
            {/* Gridlines + y-axis labels */}
            {gridLines.map((ratio) => {
              const y = padding.top + plotHeight - ratio * plotHeight;

              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                    stroke="#e5e5e5"
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={11}
                    fill="#a3a3a3"
                  >
                    {formatCompactCurrency(max * ratio)}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {buckets.map((bucket, index) => {
              const barHeight =
                max > 0 ? (bucket.amount / max) * plotHeight : 0;
              const x =
                padding.left + barSlot * index + (barSlot - barWidth) / 2;
              const y = padding.top + plotHeight - barHeight;

              return (
                <rect
                  key={bucket.date}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, bucket.amount > 0 ? 1 : 0)}
                  rx={2}
                  fill={hovered === index ? "#171717" : "#005977"}
                  opacity={hovered === null || hovered === index ? 1 : 0.45}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {/* Trend line */}
            {buckets.length > 1 && (
              <polyline
                points={points}
                fill="none"
                stroke="#171717"
                strokeWidth={1.5}
                strokeLinejoin="round"
                opacity={0.5}
              />
            )}

            {/* x-axis labels — first, middle and last only, to avoid clutter */}
            {buckets.length > 0 && (
              <>
                <text
                  x={padding.left}
                  y={height - 12}
                  fontSize={11}
                  fill="#a3a3a3"
                >
                  {formatShortDate(buckets[0].date)}
                </text>
                {buckets.length > 2 && (
                  <text
                    x={padding.left + plotWidth / 2}
                    y={height - 12}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#a3a3a3"
                  >
                    {formatShortDate(
                      buckets[Math.floor(buckets.length / 2)].date,
                    )}
                  </text>
                )}
                <text
                  x={width - padding.right}
                  y={height - 12}
                  textAnchor="end"
                  fontSize={11}
                  fill="#a3a3a3"
                >
                  {formatShortDate(buckets[buckets.length - 1].date)}
                </text>
              </>
            )}
          </svg>

          {/* Tooltip for the hovered bucket */}
          {hovered !== null && buckets[hovered] && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm">
              <span className="text-neutral-600">
                {formatShortDate(buckets[hovered].from)}
                {buckets[hovered].from !== buckets[hovered].to &&
                  ` → ${formatShortDate(buckets[hovered].to)}`}
              </span>
              <span className="font-semibold text-neutral-800">
                {formatCurrency(buckets[hovered].amount)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
