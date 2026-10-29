"use client";

import { UserDataProps } from "@/services/user.service";
import { BuildingDataProps } from "@/services/building.service";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface TableProps {
  isLoading: boolean;
  users: UserDataProps[];
  buildings: BuildingDataProps[];
  openAddModal: () => void;
  openEditModal: (user: UserDataProps) => void;
  handleDelete: (user: UserDataProps) => void;
}

const UserTable = ({
  isLoading,
  users,
  buildings,
  openAddModal,
  openEditModal,
  handleDelete,
}: TableProps) => {
  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Accounts</h3>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-neutral-700 transition-colors"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_2fr_2fr_1fr_auto] gap-2 border-b border-neutral-300 pb-2 px-2">
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Email
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          User Type
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Unit Owner
        </h5>
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Building
        </h5>
        <h5 className="text-center font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Unit No.
        </h5>
        <h5 className="text-right font-semibold text-sm text-neutral-500 uppercase tracking-wide w-20">
          Actions
        </h5>
      </div>

      {/* Rows */}
      {isLoading ? (
        <p className="text-center text-neutral-400 py-8 text-sm">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">
          No users yet. Click &quot;Add User&quot; to get started.
        </p>
      ) : (
        users.map((user) => (
          <div
            key={user.user_id}
            className="grid grid-cols-[2fr_1fr_2fr_2fr_1fr_auto] gap-2 items-center py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
          >
            <p className="text-left text-neutral-800 truncate">{user.email}</p>
            <p className="text-left">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.type === "Super Admin"
                    ? "bg-purple-100 text-purple-700"
                    : user.type === "Admin"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {user.type}
              </span>
            </p>
            <p className="text-left text-neutral-800">
              {user.name || <span className="text-neutral-400">—</span>}
            </p>
            <p className="text-left text-neutral-800">
              {user.building ? (
                (buildings.find((b) => b.building_id === user.building)?.name ??
                "—")
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </p>
            <p className="text-center text-neutral-600">
              {user.unit_number || "—"}
            </p>
            <div className="flex justify-end gap-1 w-20">
              <button
                onClick={() => openEditModal(user)}
                className="p-1.5 rounded-md text-neutral-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                aria-label={`Edit ${user.email}`}
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(user)}
                className="p-1.5 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label={`Delete ${user.email}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserTable;
