"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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
  getExpenses,
} from "@/services/expense.service";
import ExpenseModal from "./ExpenseModal";
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

  const loadExpenses = async () => {
    const result = await getExpenses();
    setExpenses(result.expenses ?? []);
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
    <div className="pt-2 pb-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Expenses</h2>
          <p className="text-sm text-neutral-500">
            Total tracked spend: ₱{totalExpenses.toLocaleString()}
          </p>
        </div>

        <button
          onClick={() => {
            setForm(emptyExpenseForm);
            setErrors({});
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-700"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-neutral-500"
                  >
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr
                    key={expense.expense_id}
                    className="border-t border-neutral-200"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-800">
                      {expense.reason}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      ₱{Number(expense.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {new Date(expense.occurred_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {expense.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(expense)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
