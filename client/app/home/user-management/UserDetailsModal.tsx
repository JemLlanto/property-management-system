"use client";

import { UserDataProps } from "@/services/user.service";
import { BuildingDataProps } from "@/services/building.service";
import { formatDate } from "@/utils/date.helper";
import {
  Building,
  CalendarDays,
  Hash,
  Mail,
  User,
  UserRound,
  X,
} from "lucide-react";

interface ModalProps {
  user: UserDataProps;
  buildings: BuildingDataProps[];
  onClose: () => void;
  onEdit: (user: UserDataProps) => void;
}

const UserDetailsModal = ({ user, buildings, onClose, onEdit }: ModalProps) => {
  const building = user.building
    ? buildings.find((b) => b.building_id === user.building)
    : undefined;

  const typeStyles: Record<string, string> = {
    "Super Admin": "bg-purple-100 text-purple-700",
    Admin: "bg-blue-100 text-blue-700",
    "Unit Owner": "bg-neutral-100 text-neutral-700",
  };

  const details = [
    {
      icon: <User size={16} />,
      label: "Full Name",
      value: user.name || "—",
    },
    {
      icon: <Mail size={16} />,
      label: "Email",
      value: user.email || "—",
    },
    {
      icon: <UserRound size={16} />,
      label: "User Type",
      value: user.type,
      badge: true,
    },
    {
      icon: <Hash size={16} />,
      label: "Unit Number",
      value: user.unit_number || "—",
    },
    {
      icon: <Building size={16} />,
      label: "Building",
      value: building ? building.name : "—",
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold text-neutral-800 mb-1">
          User Details
        </h3>
        <p className="text-sm text-neutral-500 mb-5">
          Full account information for this user.
        </p>

        {/* Identity summary */}
        <div className="flex items-center gap-3 rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold text-sm shrink-0">
            {(user.name || user.email || user.unit_number || "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-800 truncate">
              {user.name || user.email || "Unnamed User"}
            </p>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                typeStyles[user.type] ?? "bg-neutral-100 text-neutral-700"
              }`}
            >
              {user.type}
            </span>
          </div>
        </div>

        {/* Detail rows */}
        <div className="space-y-3">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="grid grid-cols-[1fr_1.6fr] gap-3 items-start"
            >
              <span className="flex items-center gap-2 text-sm text-neutral-500">
                {detail.icon}
                {detail.label}
              </span>
              <span className="text-sm text-neutral-800 wrap-break-word">
                {detail.badge ? (
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      typeStyles[user.type] ?? "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {detail.value}
                  </span>
                ) : (
                  detail.value
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Timestamps */}
        <div className="mt-5 pt-4 border-t border-neutral-100 space-y-2">
          <p className="flex items-center gap-2 text-xs text-neutral-400">
            <CalendarDays size={14} />
            Created: {user.created_at ? formatDate(user.created_at) : "—"}
            {" · "}
            Updated: {user.updated_at ? formatDate(user.updated_at) : "—"}
          </p>
          <p className="text-xs text-neutral-400 break-all">
            User ID: {user.user_id}
          </p>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium py-2 hover:bg-neutral-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(user);
            }}
            className="flex-1 rounded-lg bg-neutral-900 text-white text-sm font-medium py-2 hover:bg-neutral-700 transition-colors"
          >
            Edit User
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
