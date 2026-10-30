"use client";

import {
  BILLING_CYCLES,
  BillDataProps,
  BillFormDataProps,
  BillingCycle,
  createBill,
  emptyBillForm,
  updateBill,
} from "@/services/bill.service";
import { X } from "lucide-react";
import React, { Dispatch, SetStateAction } from "react";

interface ModalProps {
  editingBill: BillDataProps | null;
  form: BillFormDataProps;
  errors: Partial<BillFormDataProps>;
  setBills: Dispatch<SetStateAction<BillDataProps[]>>;
  setForm: Dispatch<SetStateAction<BillFormDataProps>>;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  setErrors: Dispatch<SetStateAction<Partial<BillFormDataProps>>>;
}

const BillModal = ({
  form,
  editingBill,
  errors,
  setBills,
  setForm,
  setIsModalOpen,
  setErrors,
}: ModalProps) => {
  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyBillForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<BillFormDataProps> = {};

    if (!form.name.trim()) {
      newErrors.name = "Bill name is required";
    }

    if (!form.due_date) {
      newErrors.due_date = "Due date is required";
    } else if (!BILLING_CYCLES.includes(form.due_date as BillingCycle)) {
      newErrors.due_date = "Please select a valid billing cycle";
    }

    if (form.amount === null || form.amount === "") {
      newErrors.amount = "Amount is required";
    } else if (Number(form.amount) <= 0 || Number.isNaN(Number(form.amount))) {
      newErrors.amount = "Amount must be greater than 0";
    }

    const discount = Number(form.discount_percent ?? 0);

    if (!Number.isFinite(discount) || discount < 0 || discount >= 100) {
      newErrors.discount_percent = "Discount must be between 0 and 99.99";
    }

    const lateFee = Number(form.late_fee_amount ?? 0);

    if (!Number.isFinite(lateFee) || lateFee < 0) {
      newErrors.late_fee_amount = "Late fee cannot be negative";
    }

    const graceDays = Number(form.late_fee_grace_days ?? 0);

    if (!Number.isInteger(graceDays) || graceDays < 0) {
      newErrors.late_fee_grace_days = "Grace days must be 0 or more";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (editingBill) {
      try {
        const response = await updateBill(editingBill.bill_id, {
          name: form.name.trim(),
          due_date: form.due_date,
          amount: Number(form.amount),
          discount_percent: Number(form.discount_percent ?? 0),
          late_fee_amount: Number(form.late_fee_amount ?? 0),
          late_fee_type: form.late_fee_type,
          late_fee_grace_days: Number(form.late_fee_grace_days ?? 0),
        });

        if (response.success) {
          setBills((prev) =>
            prev.map((b) =>
              b.bill_id === response.bill.bill_id ? response.bill : b,
            ),
          );
        }
      } catch (err) {
        console.error("Error Occurred: ", err);
      }
    } else {
      try {
        const response = await createBill({
          name: form.name.trim(),
          due_date: form.due_date,
          amount: Number(form.amount),
          discount_percent: Number(form.discount_percent ?? 0),
          late_fee_amount: Number(form.late_fee_amount ?? 0),
          late_fee_type: form.late_fee_type,
          late_fee_grace_days: Number(form.late_fee_grace_days ?? 0),
        });

        if (response.success) {
          setBills((prev) => [response.bill, ...prev]);
        }
      } catch (err) {
        console.error("Error Occurred: ", err);
      }
    }

    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 relative">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          {editingBill ? "Edit Bill" : "Add Bill"}
        </h3>

        <div className="space-y-3">
          {/* Bill Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Bill Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.name ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="e.g. Water Bill"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Due Date (Billing Cycle) */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <select
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-neutral-800 ${
                errors.due_date ? "border-red-400" : "border-neutral-300"
              }`}
            >
              <option value="" disabled>
                Select a billing cycle
              </option>
              {BILLING_CYCLES.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {cycle}
                </option>
              ))}
            </select>
            {errors.due_date && (
              <p className="text-xs text-red-500 mt-1">{errors.due_date}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={!form.amount ? "" : form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.amount ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="e.g. 1500.00"
            />
            {errors.amount && (
              <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Discount — percentage off the list price for every cycle */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              min={0}
              max={99.99}
              step="0.01"
              value={!form.discount_percent ? "" : form.discount_percent}
              onChange={(e) =>
                setForm({ ...form, discount_percent: e.target.value })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.discount_percent
                  ? "border-red-400"
                  : "border-neutral-300"
              }`}
              placeholder="0"
            />
            {errors.discount_percent && (
              <p className="text-xs text-red-500 mt-1">
                {errors.discount_percent}
              </p>
            )}
            {Number(form.discount_percent ?? 0) > 0 && (
              <p className="text-xs text-neutral-400 mt-1">
                Every cycle costs{" "}
                {(
                  Number(form.amount ?? 0) *
                  (1 - Number(form.discount_percent) / 100)
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                .
              </p>
            )}
          </div>

          {/* Late fee — charged per missed cycle once the grace period ends */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Late Fee
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={!form.late_fee_amount ? "" : form.late_fee_amount}
                onChange={(e) =>
                  setForm({ ...form, late_fee_amount: e.target.value })
                }
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                  errors.late_fee_amount
                    ? "border-red-400"
                    : "border-neutral-300"
                }`}
                placeholder="0"
              />
              {errors.late_fee_amount && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.late_fee_amount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Fee Type
              </label>
              <select
                value={form.late_fee_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    late_fee_type: e.target.value as "fixed" | "percent",
                  })
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-neutral-800"
              >
                <option value="fixed">Fixed amount</option>
                <option value="percent">Percent of bill</option>
              </select>
            </div>
          </div>

          {/* Grace period — days after the deadline before the fee applies */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Grace Period (days)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={
                form.late_fee_grace_days === null
                  ? ""
                  : form.late_fee_grace_days
              }
              onChange={(e) =>
                setForm({ ...form, late_fee_grace_days: e.target.value })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.late_fee_grace_days
                  ? "border-red-400"
                  : "border-neutral-300"
              }`}
              placeholder="0"
            />
            {errors.late_fee_grace_days && (
              <p className="text-xs text-red-500 mt-1">
                {errors.late_fee_grace_days}
              </p>
            )}
            <p className="text-xs text-neutral-400 mt-1">
              Days after a cycle deadline before the late fee is charged.
            </p>
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
            {editingBill ? "Save Changes" : "Add Bill"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillModal;
