"use client";

import {
  PaymentDataProps,
  PaymentFormDataProps,
  createPayment,
  emptyPaymentForm,
} from "@/services/payment.service";
import { BillDataProps } from "@/services/bill.service";
import { UserDataProps } from "@/services/user.service";
import { ChevronDown, Search, X } from "lucide-react";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

// Searchable dropdown for unit owners — filters by unit number or name
const UnitOwnerSelect = ({
  unitOwners,
  value,
  error,
  onChange,
}: {
  unitOwners: UserDataProps[];
  value: string;
  error?: string;
  onChange: (owner: UserDataProps) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = unitOwners.find((o) => o.user_id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return unitOwners;

    return unitOwners.filter(
      (o) =>
        (o.unit_number ?? "").toLowerCase().includes(q) ||
        (o.name ?? "").toLowerCase().includes(q) ||
        (o.email ?? "").toLowerCase().includes(q),
    );
  }, [unitOwners, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-neutral-600 mb-1">
        Unit No. <span className="text-red-500">*</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-neutral-800 ${
          error ? "border-red-400" : "border-neutral-300"
        }`}
      >
        <span className={selected ? "text-neutral-800" : "text-neutral-400"}>
          {selected
            ? `${selected.unit_number ?? "—"}${
                selected.name ? ` · ${selected.name}` : ""
              }`
            : "Select a unit owner"}
        </span>
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
            <Search size={14} className="text-neutral-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm outline-none"
              placeholder="Search unit no. or name..."
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X
                  size={14}
                  className="text-neutral-400 hover:text-neutral-600"
                />
              </button>
            )}
          </div>

          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-400">
                No unit owners found
              </li>
            ) : (
              filtered.map((owner) => (
                <li key={owner.user_id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(owner);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                      owner.user_id === value
                        ? "bg-neutral-100 font-medium"
                        : ""
                    }`}
                  >
                    <span className="text-neutral-800">
                      {owner.unit_number ?? "—"}
                    </span>
                    {owner.name && (
                      <span className="text-neutral-500"> · {owner.name}</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

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
      });

      if (response.success) {
        setPayments((prev) => [response.payment, ...prev]);
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
              setForm({ ...form, paid_by_id: owner.user_id })
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

          {/* Amount — prefilled from the selected bill, still editable */}
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
