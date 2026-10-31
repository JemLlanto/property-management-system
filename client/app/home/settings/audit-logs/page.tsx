"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import { checkUser } from "@/utils/auth.helper";
import { useStaffOnlyPage } from "@/utils/rbac.helper";
import { formatDate } from "@/utils/date.helper";
import { AuditLogProps, getAuditTrail } from "@/services/audit.service";

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

  const loadLogs = async (nextPage: number) => {
    const result = await getAuditTrail({
      page: nextPage,
      pageSize: PAGE_SIZE,
    });

    if (result.success) {
      setLogs(result.logs);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    }
  };

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
        await loadLogs(1);
        setIsReady(true);
      } catch (err) {
        console.error("Error loading audit logs:", err);
      } finally {
        dispatch(setIsLoading(false));
      }
    };

    validateUser();
  }, [dispatch, router]);

  useEffect(() => {
    if (!isReady) return;
    loadLogs(page);
  }, [page, isReady]);

  return (
    <div className="pt-2 pb-10 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">
            Audit Logs
          </h2>
          <p className="text-sm text-neutral-500">
            Recent account and record activity in the system.
          </p>
        </div>

        <Link
          href="/home/settings"
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <ArrowLeft size={16} />
          Back to settings
        </Link>
      </div>

      <section className="w-full bg-white border border-gray-200 rounded-xl shadow-sm font-sans overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2 text-neutral-800">
            <FileText size={18} />
            <h3 className="text-lg font-semibold">Recent activity</h3>
          </div>

          <div className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
            {total} total entries
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-neutral-500">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-500">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">Actor</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Entity</th>
                  <th className="px-5 py-3 font-semibold">Summary</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.audit_id}
                    className="border-t border-neutral-200 align-top hover:bg-neutral-50"
                  >
                    <td className="px-5 py-3 text-neutral-700 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3 text-neutral-700">
                      <div className="font-medium">
                        {log.actor_name || "Unknown user"}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {log.actor_id || "system"}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-700 whitespace-nowrap">
                      {log.entity_type}
                    </td>
                    <td className="px-5 py-3 text-neutral-700">
                      <div className="max-w-xl">
                        {log.summary || "No summary provided"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-5 py-4 text-sm text-neutral-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || isLoading}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page >= totalPages || isLoading}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AuditLogsPage;
