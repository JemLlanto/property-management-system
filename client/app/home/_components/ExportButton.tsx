"use client";

import { downloadCsv } from "@/utils/dashboard.helper";
import { Download } from "lucide-react";

interface ExportButtonProps {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  label?: string;
  disabled?: boolean;
}

// Downloads the current view of a report as a CSV file.
const ExportButton = ({
  filename,
  headers,
  rows,
  label = "Export CSV",
  disabled = false,
}: ExportButtonProps) => {
  return (
    <button
      onClick={() => downloadCsv(filename, headers, rows)}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-700 text-sm font-medium px-3 py-1.5 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={14} />
      {label}
    </button>
  );
};

export default ExportButton;
