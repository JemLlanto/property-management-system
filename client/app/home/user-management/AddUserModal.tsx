import {
  emptyForm,
  getChangedFields,
  ItemDataProps,
  ItemFormDataProps,
  itemService,
} from "@/services/Item.service";
import { X } from "lucide-react";
import React, { Dispatch, SetStateAction, useState } from "react";
import Swal from "sweetalert2";

interface ModalProps {
  editingId: number | null;
  originalItem: ItemFormDataProps;
  form: ItemFormDataProps;
  errors: Partial<ItemFormDataProps>;
  setCurrentItems: Dispatch<SetStateAction<ItemDataProps[]>>;
  setForm: Dispatch<SetStateAction<ItemFormDataProps>>;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  setErrors: Dispatch<SetStateAction<Partial<ItemFormDataProps>>>;
}

const AddUserModal = ({
  form,
  editingId,
  originalItem,
  errors,
  setCurrentItems,
  setForm,
  setIsModalOpen,
  setErrors,
}: ModalProps) => {
  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<ItemFormDataProps> = {};
    if (!form.name.trim()) newErrors.name = "Item name is required";
    if (!form.quantity || Number(form.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";
    if (!form.price || Number(form.price) < 0)
      newErrors.price = "Price must be a valid amount";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (editingId !== null) {
      // Edit existing item
      try {
        const changes = getChangedFields(originalItem, form);

        const response = await itemService("PATCH", editingId, changes);

        if (response.success) {
          // Prepare the updated data
          const updatedItem: ItemDataProps = {
            id: response.data.id,
            name: response.data.name,
            quantity: response.data.quantity,
            price: response.data.price,
            created_at: response.data.created_at,
            updated_at: response.data.updated_at,
          };
          // Update the changed item
          setCurrentItems((prev) =>
            prev.map((item) =>
              item.id === updatedItem.id ? updatedItem : item,
            ),
          );

          // Success Message
          Swal.fire({
            icon: "success",
            title: "Item updated",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("Error Occured: ", err);
      }
    } else {
      // Add new item
      try {
        const response = await itemService("POST", 0, form);
        if (response.success) {
          const newItem: ItemDataProps = {
            id: response.data.id,
            name: response.data.name,
            quantity: response.data.quantity,
            price: response.data.price,
            created_at: response.data.created_at,
            updated_at: response.data.updated_at,
          };
          setCurrentItems((prev) => [newItem, ...prev]);
          Swal.fire({
            icon: "success",
            title: "Item added",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("Error Occured: ", err);
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
          {editingId !== null ? "Edit Item" : "Add Item"}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.name ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="e.g. Widget A"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              value={!form.quantity ? "" : form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: Number(e.target.value) })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.quantity ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="0"
            />
            {errors.quantity && (
              <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={!form.price ? "" : form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.price ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-xs text-red-500 mt-1">{errors.price}</p>
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
            {editingId !== null ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
