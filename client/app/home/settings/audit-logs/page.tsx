"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import { checkUser } from "@/utils/auth.helper";
import { useStaffOnlyPage } from "@/utils/rbac.helper";
import { AuditLogProps, getAuditTrail } from "@/services/audit.service";
import AuditLogTable from "./AuditLogTable";

const PAGE_SIZE = 10;

const AuditLogsPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loading.isLoading);
  useStaffOnlyPage();

  const [logs, setLogs] = useState<AuditLogProps[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Search is debounced so typing does not fire a request per keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async (nextPage: number, term: string) => {
    const result = await getAuditTrail({
      page: nextPage,
      pageSize: PAGE_SIZE,
      ...(term ? { search: term } : {}),
    });

    if (result.success) {
      setLogs(result.logs);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    }
  }, []);

  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));

      try {
        const response = await checkUser();

        if (!response.success) {
          router.push("/");
          return;
        }

        dispatch(setUser(response.user));
        await loadLogs(1, "");
        setIsReady(true);
      } catch (err) {
        console.error("Error loading audit logs:", err);
      } finally {
        dispatch(setIsLoading(false));
      }
    };

    validateUser();
  }, [dispatch, router, loadLogs]);

  useEffect(() => {
    if (!isReady) return;
    loadLogs(page, search);
  }, [page, search, isReady, loadLogs]);

  // Debounce the search box — 300ms after the last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // a new search restarts at the first page
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="pt-2">
      <AuditLogTable
        isLoading={isLoading}
        logs={logs}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full mx-auto mt-3 flex items-center justify-between text-sm text-neutral-600">
          <span>
            {total} entr{total === 1 ? "y" : "ies"} · Page {page} of{" "}
            {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
