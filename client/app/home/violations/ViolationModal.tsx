"use client";

import { Dispatch, SetStateAction } from "react";
import { X } from "lucide-react";
import { UserDataProps } from "@/services/user.service";
import {
  createViolation,
  emptyViolationForm,
  SEVERITIES,
  updateViolation,
  VIOLATION_TYPES,
  ViolationDataProps,
  ViolationFormDataProps,
  ViolationStatus,
} from "@/services/violation.service";
import UnitOwnerSelect from "../_components/UnitOwnerSelect";

interface ModalProps {
  editingViolation: ViolationDataProps | null;
  // All unit owner accounts — the dropdown source
  unitOwners: UserDataProps[];
  form: ViolationFormDataProps;
  errors: Partial<ViolationFormDataProps>;
  setViolations: Dispatch<SetStateAction<ViolationDataProps[]>>;
  setForm: Dispatch<SetStateAction<ViolationFormDataProps>>;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  setErrors: Dispatch<SetStateAction<Partial<ViolationFormDataProps>>>;
  onSaved: () => void;
}

const ViolationModal = ({
  editingViolation,
  unitOwners,
  form,
  errors,
  setViolations,
  setForm,
  setIsModalOpen,
  setErrors,
  onSaved,
}: ModalProps) => {
  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyViolationForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const nextErrors: Partial<ViolationFormDataProps> = {};

    if (!form.unit_number.trim()) {
      nextErrors.unit_number = "Unit number is required";
    }

    if (!form.violation_type) {
      nextErrors.violation_type = "Please select a violation type";
    }

    if (
      form.violation_type === "Other" &&
      !form.description.trim() &&
      !editingViolation
    ) {
      nextErrors.description = "Details are required for a custom type";
    }

    if (form.status === "Resolved" && !form.resolution_remarks.trim()) {
      nextErrors.resolution_remarks =
        "Remarks are required when marking as resolved";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: ViolationFormDataProps = {
      ...form,
      unit_number: form.unit_number.trim(),
      description: form.description.trim(),
      resolution_remarks: form.resolution_remarks.trim(),
    };

    try {
      const response = editingViolation
        ? await updateViolation(editingViolation.violation_id, payload)
        : await createViolation(payload);

      if (response.success) {
        setViolations((prev) =>
          editingViolation
            ? prev.map((v) =>
                v.violation_id === editingViolation.violation_id
                  ? (response.violation ?? v)
                  : v,
              )
            : [response.violation, ...prev].filter(Boolean),
        );

        onSaved();
        closeModal();
      }
    } catch (err) {
      console.error("Error saving violation:", err);
    }
  };

  const inputClass = (hasError?: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-neutral-800 ${
      hasError ? "border-red-400" : "border-neutral-300"
    }`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          {editingViolation ? "Edit Violation" : "Record Violation"}
        </h3>
        <div className="h-120 overflow-y-auto">
          <div className="space-y-3">
            {/* Unit owner */}
            <UnitOwnerSelect
              unitOwners={unitOwners}
              value={form.unit_number}
              error={errors.unit_number}
              onChange={(owner) =>
                setForm({ ...form, unit_number: owner.unit_number ?? "" })
              }
            />

            {/* Violation type */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Violation Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.violation_type}
                onChange={(e) =>
                  setForm({ ...form, violation_type: e.target.value })
                }
                className={inputClass(errors.violation_type)}
              >
                <option value="">Select a type</option>
                {VIOLATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.violation_type && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.violation_type}
                </p>
              )}
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={form.severity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    severity: e.target
                      .value as ViolationFormDataProps["severity"],
                  })
                }
                className={inputClass()}
              >
                {SEVERITIES.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Details{" "}
                {form.violation_type === "Other" && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={`${inputClass(errors.description)} min-h-20 resize-y`}
                placeholder="What happened? Where? Anyone involved?"
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Date occurred */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Date Occurred
              </label>
              <input
                type="date"
                value={form.occurred_at}
                onChange={(e) =>
                  setForm({ ...form, occurred_at: e.target.value })
                }
                className={inputClass()}
              />
              <p className="text-xs text-neutral-400 mt-1">
                Leave blank to use today.
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as ViolationStatus,
                  })
                }
                className={inputClass()}
              >
                <option value="Open">Open</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Resolution remarks — only when resolving */}
            {form.status === "Resolved" && (
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">
                  Resolution Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.resolution_remarks}
                  onChange={(e) =>
                    setForm({ ...form, resolution_remarks: e.target.value })
                  }
                  className={`${inputClass(errors.resolution_remarks)} min-h-20 resize-y`}
                  placeholder="What was done to resolve this?"
                />
                {errors.resolution_remarks && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.resolution_remarks}
                  </p>
                )}
              </div>
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
            {editingViolation ? "Save Changes" : "Record Violation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViolationModal;
