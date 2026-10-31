"use client";

import { X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import {
  EXPENSE_REASONS,
  ExpenseFormDataProps,
  createExpense,
} from "@/services/expense.service";

interface ExpenseModalProps {
  form: ExpenseFormDataProps;
  setForm: Dispatch<SetStateAction<ExpenseFormDataProps>>;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  errors: Partial<ExpenseFormDataProps>;
  setErrors: Dispatch<SetStateAction<Partial<ExpenseFormDataProps>>>;
  onCreated: () => void;
}

const ExpenseModal = ({
  form,
  setForm,
  setIsModalOpen,
  errors,
  setErrors,
  onCreated,
}: ExpenseModalProps) => {
  const closeModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  const validate = () => {
    const nextErrors: Partial<ExpenseFormDataProps> = {};

    const resolvedReason =
      String(form.custom_reason ?? "").trim() || form.reason;

    if (!resolvedReason) {
      nextErrors.reason = "Please choose or type a reason";
    }

    if (form.amount === null || form.amount === "") {
      nextErrors.amount = "Amount is required";
    } else if (Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      nextErrors.amount = "Amount must be greater than 0";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const response = await createExpense(form);

      if (response.success) {
        onCreated();
        closeModal();
      }
    } catch (err) {
      console.error("Error creating expense:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          Record Expense
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={form.reason}
              onChange={(e) =>
                setForm({
                  ...form,
                  reason: e.target.value,
                  custom_reason:
                    e.target.value === "Other" ? form.custom_reason : "",
                })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-neutral-800 ${
                errors.reason ? "border-red-400" : "border-neutral-300"
              }`}
            >
              <option value="">Select a reason</option>
              {EXPENSE_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>

            {form.reason === "Other" && (
              <input
                className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
                value={form.custom_reason}
                onChange={(e) =>
                  setForm({ ...form, custom_reason: e.target.value })
                }
                placeholder="Type a custom reason"
              />
            )}

            {errors.reason && (
              <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={form.amount ?? ""}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.amount ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="e.g. 1200.00"
            />
            {errors.amount && (
              <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
              placeholder="Optional details about the expense"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Date
            </label>
            <input
              type="date"
              value={form.occurred_at}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                setForm({ ...form, occurred_at: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={closeModal}
            className="flex-1 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium py-2 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-neutral-900 text-white text-sm font-medium py-2 hover:bg-neutral-700"
          >
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
