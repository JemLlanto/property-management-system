"use client";

import {
  PaymentDataProps,
  PaymentFormDataProps,
  createPayment,
  emptyPaymentForm,
} from "@/services/payment.service";
import { BillDataProps } from "@/services/bill.service";
import { UserDataProps } from "@/services/user.service";
import UnitOwnerSelect from "../_components/UnitOwnerSelect";
import { X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface ModalProps {
  bills: BillDataProps[];
  unitOwners: UserDataProps[];
  form: PaymentFormDataProps;
  errors: Partial<PaymentFormDataProps>;
  setPayments: Dispatch<SetStateAction<PaymentDataProps[]>>;
  setForm: Dispatch<SetStateAction<PaymentFormDataProps>>;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  setErrors: Dispatch<SetStateAction<Partial<PaymentFormDataProps>>>;
}

const PaymentModal = ({
  bills,
  unitOwners,
  form,
  errors,
  setPayments,
  setForm,
  setIsModalOpen,
  setErrors,
}: ModalProps) => {
  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyPaymentForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<PaymentFormDataProps> = {};

    if (!form.paid_by_id) {
      newErrors.paid_by_id = "Unit owner is required";
    }

    if (form.bill_id === null) {
      newErrors.bill_id = "Please select a bill";
    }

    if (form.amount === null || form.amount === "") {
      newErrors.amount = "Amount is required";
    } else if (Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    const repeatCount = Number(form.repeat_count ?? 1);

    if (!Number.isInteger(repeatCount) || repeatCount < 1) {
      newErrors.repeat_count = "Repeat count must be at least 1";
    }

    if (form.paid_at) {
      const chosen = new Date(`${form.paid_at}T00:00:00`);

      if (Number.isNaN(chosen.getTime())) {
        newErrors.paid_at = "Payment date is invalid";
      } else {
        const endOfDay = new Date(chosen);
        endOfDay.setHours(23, 59, 59, 999);

        if (endOfDay > new Date()) {
          newErrors.paid_at = "Payment date cannot be in the future";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const response = await createPayment({
        bill_id: form.bill_id,
        paid_by_id: form.paid_by_id,
        amount: Number(form.amount),
        repeat_count: Number(form.repeat_count ?? 1),
        paid_at: form.paid_at,
      });

      if (response.success) {
        const created = Array.isArray(response.payments)
          ? response.payments
          : response.payment
            ? [response.payment]
            : [];

        if (created.length > 0) {
          setPayments((prev) => [...created, ...prev]);
        }
      }
    } catch (err) {
      console.error("Error Occurred: ", err);
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
          Record Payment
        </h3>

        <div className="space-y-3">
          {/* Unit No. — searchable dropdown of unit owners */}
          <UnitOwnerSelect
            unitOwners={unitOwners}
            value={form.paid_by_id}
            error={errors.paid_by_id}
            onChange={(owner) =>
              setForm({ ...form, paid_by_id: owner.unit_number ?? "" })
            }
          />

          {/* For — bill dropdown; picking one prefills the amount */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              For <span className="text-red-500">*</span>
            </label>
            <select
              value={form.bill_id ?? ""}
              onChange={(e) => {
                const bill = bills.find(
                  (b) => b.bill_id === Number(e.target.value),
                );

                setForm({
                  ...form,
                  bill_id: bill ? bill.bill_id : null,
                  // Prefill amount from the selected bill
                  amount: bill ? bill.amount : form.amount,
                });
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-neutral-800 ${
                errors.bill_id ? "border-red-400" : "border-neutral-300"
              }`}
            >
              <option value="" disabled>
                Select a bill
              </option>
              {bills.map((bill) => (
                <option key={bill.bill_id} value={bill.bill_id}>
                  {bill.name}
                </option>
              ))}
            </select>
            {errors.bill_id && (
              <p className="text-xs text-red-500 mt-1">{errors.bill_id}</p>
            )}
          </div>

          {/* Amount — prefilled from the selected bill, still editable.
              A partial amount is allowed — it settles part of a cycle and
              the remainder stays outstanding. */}
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
            <p className="text-xs text-neutral-400 mt-1">
              Partial payments are accepted — the remaining balance stays
              outstanding.
            </p>
          </div>

          {/* Number of identical delayed payments to record in one action */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Delayed payment count <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={form.repeat_count}
              onChange={(e) =>
                setForm({
                  ...form,
                  repeat_count:
                    e.target.value === "" ? 1 : Number(e.target.value),
                })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.repeat_count ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="1"
            />
            {errors.repeat_count && (
              <p className="text-xs text-red-500 mt-1">{errors.repeat_count}</p>
            )}
            <p className="text-xs text-neutral-400 mt-1">
              Enter how many delayed payments should be recorded for this bill.
            </p>
          </div>

          {/* Payment date — optional, blank means today. Lets you
              backdate money that was received earlier. */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={form.paid_at}
              onChange={(e) => setForm({ ...form, paid_at: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.paid_at ? "border-red-400" : "border-neutral-300"
              }`}
            />
            {errors.paid_at && (
              <p className="text-xs text-red-500 mt-1">{errors.paid_at}</p>
            )}
            <p className="text-xs text-neutral-400 mt-1">
              Leave blank to use today&apos;s date.
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
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
