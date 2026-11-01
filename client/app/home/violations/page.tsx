"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { checkUser } from "@/utils/auth.helper";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import {
  deleteViolation,
  emptyViolationForm,
  ViolationDataProps,
  ViolationFormDataProps,
  getViolationsPaginated,
} from "@/services/violation.service";
import { useSortableColumns } from "@/hooks/useSortableColumns";
import { getUsers, UserDataProps } from "@/services/user.service";
import ViolationModal from "./ViolationModal";
import ViolationTable from "./ViolationTable";
import { useStaffOnlyPage } from "@/utils/rbac.helper";

const ViolationsPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loading.isLoading);
  useStaffOnlyPage();

  const [violations, setViolations] = useState<ViolationDataProps[]>([]);
  const [users, setUsers] = useState<UserDataProps[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingViolation, setEditingViolation] =
    useState<ViolationDataProps | null>(null);
  const [form, setForm] = useState<ViolationFormDataProps>(emptyViolationForm);
  const [errors, setErrors] = useState<Partial<ViolationFormDataProps>>({});

  // Pagination + search state. Search is debounced so typing does not
  // fire a request per keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Column sorting — clicking a header cycles asc → desc → default
  const sortable = useSortableColumns();

  // Sorting changes the row order, so go back to the first page. Both
  // state updates happen in the same handler, so the page and the sort
  // reach the fetch together in one request.
  const handleSort = useCallback(
    (column: string) => {
      sortable.toggleSort(column);
      setPage(1);
    },
    [sortable],
  );

  // Only Unit Owner accounts can be issued a violation
  const unitOwners = useMemo(
    () => users.filter((u) => u.type === "Unit Owner"),
    [users],
  );

  // Load one page of violations
  const loadViolations = useCallback(async () => {
    const result = await getViolationsPaginated({
      page,
      pageSize,
      search,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...sortable.sortParams,
    });

    setViolations(result.violations);
    setTotal(result.total);
    setTotalPages(result.total_pages);
  }, [page, pageSize, search, statusFilter, sortable.sortParams]);

  // Checking user authorization and loading the violation list
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
        await loadViolations();

        // Unit owners fill the unit dropdown in the modal
        const userRes = await getUsers();
        setUsers(userRes.users ?? []);
      } catch (err) {
        console.error("Error: ", err);
      } finally {
        dispatch(setIsLoading(false));
      }
    };

    validateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload violations when the page, search, filter or sort changes
  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  // Debounce the search box — 300ms after the last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // a new search restarts at the first page
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const openAddModal = () => {
    setEditingViolation(null);
    setForm(emptyViolationForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (violation: ViolationDataProps) => {
    setEditingViolation(violation);
    setForm({
      unit_number: violation.unit_number,
      violation_type: violation.violation_type,
      severity:
        (violation.severity as ViolationFormDataProps["severity"]) ?? "Minor",
      description: violation.description ?? "",
      occurred_at: violation.occurred_at
        ? violation.occurred_at.slice(0, 10)
        : "",
      status: (violation.status as ViolationFormDataProps["status"]) ?? "Open",
      resolution_remarks: violation.resolution_remarks ?? "",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (violation: ViolationDataProps) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this violation?",
      html: `Unit <b>${violation.unit_number}</b> · ${violation.violation_type} (${violation.severity})<br/>This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteViolation(violation.violation_id);

      if (response.success) {
        setViolations((prev) =>
          prev.filter((v) => v.violation_id !== violation.violation_id),
        );
        Swal.fire({
          icon: "success",
          title: "Violation deleted",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Unexpected Error: ", err);
    }
  };

  return (
    <div className="pt-2">
      <ViolationTable
        isLoading={isLoading}
        violations={violations}
        openAddModal={openAddModal}
        openEditModal={openEditModal}
        handleDelete={handleDelete}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        sortable={{ ...sortable, toggleSort: handleSort }}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full mx-auto mt-3 flex items-center justify-between text-sm text-neutral-600">
          <span>
            {total} violation{total === 1 ? "" : "s"} · Page {page} of{" "}
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

      {/* Record/Edit Violation Modal */}
      {isModalOpen && (
        <ViolationModal
          editingViolation={editingViolation}
          unitOwners={unitOwners}
          form={form}
          errors={errors}
          setViolations={setViolations}
          setForm={setForm}
          setIsModalOpen={setIsModalOpen}
          setErrors={setErrors}
          onSaved={loadViolations}
        />
      )}
    </div>
  );
};

export default ViolationsPage;
