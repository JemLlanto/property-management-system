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
import AddUserModal from "./AddUserModal";
import UserTable from "./UserTable";

const HomePage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.itemData);
  const isLoading = useAppSelector((state) => state.loading.isLoading);
  const [form, setForm] = useState<ItemFormDataProps>(emptyForm);

  const [currentItems, setCurrentItems] = useState<ItemDataProps[]>(items);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [originalItem, setOriginalItem] =
    useState<ItemFormDataProps>(emptyForm);
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
        <UserTable
          isLoading={isLoading}
          currentItems={currentItems}
          openAddModal={openAddModal}
          openEditModal={openEditModal}
          handleDelete={handleDelete}
        />

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <AddUserModal
            editingId={editingId}
            form={form}
            originalItem={originalItem}
            errors={errors}
            setCurrentItems={setCurrentItems}
            setForm={setForm}
            setIsModalOpen={setIsModalOpen}
            setErrors={setErrors}
          />
        )}
      </div>
    </>
  );
};

export default HomePage;
