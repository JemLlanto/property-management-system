"use client";
import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setItems } from "@/store/itemData.slice";
import {
  emptyForm,
  getChangedFields,
  ItemDataProps,
  ItemFormDataProps,
  itemService,
} from "@/services/Item.service";
import { setIsLoading } from "@/store/isLoading.slice";

const HomePage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.itemData);
  const isLoading = useAppSelector((state) => state.loading.isLoading);

  const [currentItems, setCurrentItems] = useState<ItemDataProps[]>(items);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [originalItem, setOriginalItem] =
    useState<ItemFormDataProps>(emptyForm);
  const [form, setForm] = useState<ItemFormDataProps>(emptyForm);
  const [errors, setErrors] = useState<Partial<ItemFormDataProps>>({});

  // Checking user authorization
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));
      try {
        const response = await checkUser();
        if (response.success) {
          // Set user data
          dispatch(setUser(response.user));
          // Getting user items
          const itemRes = await itemService("GET");
          // Set items data
          dispatch(setItems(itemRes.data));
        } else {
          // Redirect to the landing page if not authenticated.
          router.push(`/`);
        }
      } catch (err) {
        console.error("Error: ", err);
      } finally {
        setTimeout(() => {
          dispatch(setIsLoading(false));
        }, 100);
      }
    };
    // Calling validateUser function
    validateUser();
  }, []);
  // Update current items on mount
  useEffect(() => {
    setCurrentItems(items);
  }, [items]);

  // console.log("form: ", form);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: ItemDataProps) => {
    const form = {
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    };
    setEditingId(item.id);
    setOriginalItem(form);
    setForm(form);
    setErrors({});
    setIsModalOpen(true);
  };

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

  const handleDelete = async (item: ItemDataProps) => {
    const result = await Swal.fire({
      icon: "warning",
      title: `Delete "${item.name}"?`,
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await itemService("DELETE", item.id);

      if (response.success) {
        setCurrentItems((prev) => prev.filter((i) => i.id !== item.id));
        Swal.fire({
          icon: "success",
          title: "Item deleted",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Unexpected Error: ", err);
    }
  };
  return (
    <>
      <div className="pt-2">
        <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
          {/* Header with Add button */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-neutral-800">
              Line Items
            </h4>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-neutral-700 transition-colors"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 border-b border-neutral-300 pb-2 px-2">
            <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
              Item Name
            </h5>
            <h5 className="text-center font-semibold text-sm text-neutral-500 uppercase tracking-wide">
              Quantity
            </h5>
            <h5 className="text-center font-semibold text-sm text-neutral-500 uppercase tracking-wide">
              Price
            </h5>
            <h5 className="text-right font-semibold text-sm text-neutral-500 uppercase tracking-wide w-20">
              Actions
            </h5>
          </div>

          {/* Rows */}
          {isLoading ? (
            <p className="text-center text-neutral-400 py-8 text-sm">
              Loading...
            </p>
          ) : currentItems.length === 0 ? (
            <p className="text-center text-neutral-400 py-8 text-sm">
              No items yet. Click "Add Item" to get started.
            </p>
          ) : (
            currentItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
              >
                <p className="text-left text-neutral-800">{item.name}</p>
                <p className="text-center text-neutral-600">{item.quantity}</p>
                <p className="text-center text-neutral-600">
                  ${Number(item.price).toFixed(2)}
                </p>
                <div className="flex justify-end gap-1 w-20">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-md text-neutral-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
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
                    <p className="text-xs text-red-500 mt-1">
                      {errors.quantity}
                    </p>
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
        )}
      </div>
    </>
  );
};

export default HomePage;
