// utils/dashboard.helper.tsx

// ---------- Date range ----------

// Local YYYY-MM-DD key — toISOString() would shift the day across the
// UTC boundary for timezones ahead of UTC.
export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// The start of the day, N days back (inclusive of today)
export const startOfRange = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1));
  date.setHours(0, 0, 0, 0);

  return toDateKey(date);
};

export const todayKey = (): string => toDateKey(new Date());

// The first day of the month, N months back
export const startOfMonthRange = (months: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);

  return toDateKey(date);
};

export const startOfYear = (): string => {
  const date = new Date();
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);

  return toDateKey(date);
};

// A range is valid when both bounds exist and the start is not after the
// end. The server swaps reversed bounds, but the UI flags them instead so
// the user gets immediate feedback.
export const isValidRange = (from: string, to: string): boolean => {
  if (!from || !to) return false;

  return from <= to;
};

// ---------- Formatting ----------

// Currency with the peso sign, grouped and always two decimals
export const formatCurrency = (amount: number | string | null | undefined) => {
  const value = Number(amount ?? 0);

  if (!Number.isFinite(value)) return "₱0.00";

  return `₱${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Compact currency for chart axes and dense cards — ₱12.5K
export const formatCompactCurrency = (
  amount: number | string | null | undefined,
) => {
  const value = Number(amount ?? 0);

  if (!Number.isFinite(value)) return "₱0";

  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  }

  if (abs >= 1_000) {
    return `₱${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  }

  return `₱${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatPercent = (
  value: number | string | null | undefined,
  decimals = 1,
) => {
  const num = Number(value ?? 0);

  if (!Number.isFinite(num)) return "0%";

  return `${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
};

// A "YYYY-MM-DD" key rendered as a short, readable date
export const formatShortDate = (key: string) => {
  if (!key) return "—";

  const [year, month, day] = key.split("-").map(Number);

  if (!year || !month || !day) return key;

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// A full ISO timestamp or date-only key rendered as "Nov. 30, 2026"
export const formatReadableDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const dateOnly = String(value).trim();
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(dateOnly);

  if (match) {
    const [year, month, day] = dateOnly.split("-").map(Number);
    const monthName = new Date(year, month - 1, day).toLocaleDateString(
      "en-US",
      {
        month: "short",
      },
    );

    return `${monthName}. ${day}, ${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  const monthName = date.toLocaleDateString("en-US", { month: "short" });
  return `${monthName}. ${date.getDate()}, ${date.getFullYear()}`;
};

// A full ISO timestamp rendered as "Mar 5, 2026"
export const formatTimestamp = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ---------- CSV export ----------

// Escape a single CSV cell — quotes, commas and newlines are wrapped
const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

// Build a CSV string from a header row and data rows
export const buildCsv = (headers: string[], rows: (string | number)[][]) => {
  const lines = [headers.map(csvCell).join(",")];

  for (const row of rows) {
    lines.push(row.map(csvCell).join(","));
  }

  return lines.join("\r\n");
};

// Trigger a browser download of the given CSV content
export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) => {
  const csv = buildCsv(headers, rows);
  // The BOM keeps Excel from mangling the peso sign and accents
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
