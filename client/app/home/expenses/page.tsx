"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { checkUser } from "@/utils/auth.helper";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import {
  deleteExpense,
  emptyExpenseForm,
  ExpenseDataProps,
  ExpenseFormDataProps,
  getExpensesPaginated,
} from "@/services/expense.service";
import { useSortableColumns } from "@/hooks/useSortableColumns";
import ExpenseModal from "./ExpenseModal";
import ExpenseTable from "./ExpenseTable";
import { useStaffOnlyPage } from "@/utils/rbac.helper";

const ExpensesPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loading.isLoading);
  useStaffOnlyPage();

  const [expenses, setExpenses] = useState<ExpenseDataProps[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ExpenseFormDataProps>(emptyExpenseForm);
  const [errors, setErrors] = useState<Partial<ExpenseFormDataProps>>({});

  // Pagination + search state. Search is debounced so typing does not
  // fire a request per keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
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

  // Load one page of expenses
  const loadExpenses = useCallback(async () => {
    const result = await getExpensesPaginated({
      page,
      pageSize,
      search,
      ...sortable.sortParams,
    });

    setExpenses(result.expenses);
    setTotal(result.total);
    setTotalPages(result.total_pages);
  }, [page, pageSize, search, sortable.sortParams]);

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
        await loadExpenses();
      } catch (err) {
        console.error("Error: ", err);
      } finally {
        dispatch(setIsLoading(false));
      }
    };

    validateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload expenses when the page, search or sort changes
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Debounce the search box — 300ms after the last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // a new search restarts at the first page
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const openAddModal = () => {
    setForm(emptyExpenseForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (expense: ExpenseDataProps) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this expense?",
      html: `<b>${expense.reason}</b><br/>₱${Number(expense.amount).toLocaleString()}<br/>This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteExpense(expense.expense_id);

      if (response.success) {
        setExpenses((prev) =>
          prev.filter((item) => item.expense_id !== expense.expense_id),
        );
        Swal.fire({
          icon: "success",
          title: "Expense deleted",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Unexpected Error: ", err);
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount ?? 0),
    0,
  );

  return (
    <div className="pt-2">
      <ExpenseTable
        isLoading={isLoading}
        expenses={expenses}
        openAddModal={openAddModal}
        handleDelete={handleDelete}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        sortable={{ ...sortable, toggleSort: handleSort }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full mx-auto mt-3 flex items-center justify-between text-sm text-neutral-600">
          <span>
            {total} expense{total === 1 ? "" : "s"} · Page {page} of{" "}
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

      {/* Record Expense Modal */}
      {isModalOpen && (
        <ExpenseModal
          form={form}
          setForm={setForm}
          setIsModalOpen={setIsModalOpen}
          errors={errors}
          setErrors={setErrors}
          onCreated={loadExpenses}
        />
      )}
    </div>
  );
};

export default ExpensesPage;
