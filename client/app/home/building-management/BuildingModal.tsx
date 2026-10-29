"use client";

import {
  BuildingDataProps,
  BuildingFormDataProps,
  createBuilding,
  emptyBuildingForm,
  updateBuilding,
} from "@/services/building.service";
import { X } from "lucide-react";
import React, { Dispatch, SetStateAction } from "react";

interface ModalProps {
  editingBuilding: BuildingDataProps | null;
  form: BuildingFormDataProps;
  errors: Partial<BuildingFormDataProps>;
  setBuildings: Dispatch<SetStateAction<BuildingDataProps[]>>;
  setForm: Dispatch<SetStateAction<BuildingFormDataProps>>;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  setErrors: Dispatch<SetStateAction<Partial<BuildingFormDataProps>>>;
}

const BuildingModal = ({
  form,
  editingBuilding,
  errors,
  setBuildings,
  setForm,
  setIsModalOpen,
  setErrors,
}: ModalProps) => {
  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyBuildingForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<BuildingFormDataProps> = {};

    if (!form.name.trim()) {
      newErrors.name = "Building name is required";
    }

    if (form.capacity === null || form.capacity === "") {
      newErrors.capacity = "Capacity is required";
    } else if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) <= 0) {
      newErrors.capacity = "Capacity must be a whole number greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (editingBuilding) {
      try {
        const response = await updateBuilding(editingBuilding.building_id, {
          name: form.name.trim(),
          capacity: Number(form.capacity),
        });

        if (response.success) {
          setBuildings((prev) =>
            prev.map((b) =>
              b.building_id === response.building.building_id
                ? response.building
                : b,
            ),
          );
        }
      } catch (err) {
        console.error("Error Occurred: ", err);
      }
    } else {
      try {
        const response = await createBuilding({
          name: form.name.trim(),
          capacity: Number(form.capacity),
        });

        if (response.success) {
          setBuildings((prev) => [response.building, ...prev]);
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
          {editingBuilding ? "Edit Building" : "Add Building"}
        </h3>

        <div className="space-y-3">
          {/* Building Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Building Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.name ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="e.g. Tower A"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Capacity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={!form.capacity ? "" : form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: Number(e.target.value) })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.capacity ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="e.g. 50"
            />
            {errors.capacity && (
              <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>
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
            {editingBuilding ? "Save Changes" : "Add Building"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildingModal;
