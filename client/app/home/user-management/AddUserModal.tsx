"use client";

import {
  createUser,
  emptyUserForm,
  requiresUnitNumber,
  UserDataProps,
  UserFormDataProps,
  UserType,
  USER_TYPES,
  updateUser,
} from "@/services/user.service";
import { X } from "lucide-react";
import React, { Dispatch, SetStateAction } from "react";
import Swal from "sweetalert2";

interface ModalProps {
  editingUser: UserDataProps | null;
  form: UserFormDataProps;
  originalUser: UserFormDataProps;
  errors: Partial<UserFormDataProps>;
  setUsers: Dispatch<SetStateAction<UserDataProps[]>>;
  setForm: Dispatch<SetStateAction<UserFormDataProps>>;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  setErrors: Dispatch<SetStateAction<Partial<UserFormDataProps>>>;
}

const AddUserModal = ({
  form,
  editingUser,
  originalUser,
  errors,
  setUsers,
  setForm,
  setIsModalOpen,
  setErrors,
}: ModalProps) => {
  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyUserForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<UserFormDataProps> = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (requiresUnitNumber(form.type) && !form.unit_number.trim()) {
      newErrors.unit_number = "Unit number is required for Unit Owner";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (editingUser) {
      // Update existing user — send only the changed fields
      try {
        const changes: Partial<UserFormDataProps> = {};
        (Object.keys(form) as (keyof UserFormDataProps)[]).forEach((key) => {
          if (form[key] !== originalUser[key]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (changes as any)[key] = form[key];
          }
        });

        const response = await updateUser(editingUser.user_id, changes);

        if (response.success) {
          const updated: UserDataProps = response.user;

          setUsers((prev) =>
            prev.map((u) => (u.user_id === updated.user_id ? updated : u)),
          );

          Swal.fire({
            icon: "success",
            title: "User updated",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("Error Occurred: ", err);
      }
    } else {
      // Create new user
      try {
        const response = await createUser(form);

        if (response.success) {
          setUsers((prev) => [response.user, ...prev]);

          // Show the temporary password once so the admin can share it
          Swal.fire({
            icon: "success",
            title: "User created",
            html: `
              <p style="margin-bottom:8px">Share this temporary password with the user:</p>
              <code style="font-size:1.1em;font-weight:bold;user-select:all">${response.tempPassword}</code>
            `,
            confirmButtonText: "Done",
          });
        }
      } catch (err) {
        console.error("Error Occurred: ", err);
      }
    }

    closeModal();
  };

  const unitNumberRequired = requiresUnitNumber(form.type);

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
          {editingUser ? "Edit User" : "Add User"}
        </h3>

        <div className="space-y-3">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.email ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* User Type dropdown — defaults to Unit Owner */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              User Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as UserType })
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 bg-white"
            >
              {USER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Number — required only when type is Unit Owner */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Unit Number{" "}
              {unitNumberRequired ? (
                <span className="text-red-500">*</span>
              ) : (
                <span className="text-neutral-400 text-xs">(optional)</span>
              )}
            </label>
            <input
              type="text"
              value={form.unit_number}
              onChange={(e) =>
                setForm({ ...form, unit_number: e.target.value })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                errors.unit_number ? "border-red-400" : "border-neutral-300"
              }`}
              placeholder="e.g. 12A"
            />
            {errors.unit_number && (
              <p className="text-xs text-red-500 mt-1">{errors.unit_number}</p>
            )}
          </div>

          {/* Unit Owner name — optional */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Unit Owner{" "}
              <span className="text-neutral-400 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
              placeholder="e.g. Juan Dela Cruz"
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
            {editingUser ? "Save Changes" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
