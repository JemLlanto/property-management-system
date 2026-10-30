"use client";

import { UserDataProps } from "@/services/user.service";
import { BuildingDataProps } from "@/services/building.service";
import {
  getUnpaidBills,
  IncomingBillProps,
  UnpaidBillProps,
} from "@/services/payment.service";
import { formatDate } from "@/utils/date.helper";
import {
  AlertTriangle,
  Building,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Hash,
  Mail,
  User,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ModalProps {
  user: UserDataProps;
  buildings: BuildingDataProps[];
  onClose: () => void;
  onEdit: (user: UserDataProps) => void;
}

const UserDetailsModal = ({ user, buildings, onClose, onEdit }: ModalProps) => {
  const [unpaidBills, setUnpaidBills] = useState<UnpaidBillProps[]>([]);
  const [incomingBills, setIncomingBills] = useState<IncomingBillProps[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);

  // Load bill standings for Unit Owners — missed bills plus the incoming
  // ones whose cycle has not completed yet.
  useEffect(() => {
    if (user.type !== "Unit Owner") return;

    let cancelled = false;

    const loadUnpaid = async () => {
      setIsLoadingBills(true);

      try {
        const response = await getUnpaidBills(user.user_id);

        if (!cancelled) {
          setUnpaidBills(response.unpaid_bills ?? []);
          setIncomingBills(response.incoming_bills ?? []);
        }
      } catch (err) {
        console.error("Error loading unpaid bills: ", err);
      } finally {
        if (!cancelled) {
          setIsLoadingBills(false);
        }
      }
    };

    loadUnpaid();

    return () => {
      cancelled = true;
    };
  }, [user.user_id, user.type]);
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
        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
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

        {/* Unpaid bills — Unit Owners only */}
        {user.type === "Unit Owner" && (
          <div className="mt-5 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-neutral-800">
                Unpaid Bills
              </h4>
              {unpaidBills.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  <AlertTriangle size={12} />
                  {unpaidBills.length} unpaid
                </span>
              )}
            </div>

            {isLoadingBills ? (
              <p className="text-sm text-neutral-400 py-2">Loading bills...</p>
            ) : unpaidBills.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                <p className="text-sm text-green-700">
                  No missed payments. All bills are on track.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {unpaidBills.map((bill) => (
                  <div
                    key={bill.bill_id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">
                        {bill.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {bill.due_date} · Paid {bill.paid_count}/
                        {bill.occurrences}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-neutral-800">
                        ₱
                        {(
                          Number(bill.amount) * bill.missed_count
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-red-600">
                        {bill.missed_count} missed
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Total Outstanding
                  </span>
                  <span className="text-sm font-semibold text-red-600">
                    ₱
                    {unpaidBills
                      .reduce(
                        (sum, bill) =>
                          sum + Number(bill.amount) * bill.missed_count,
                        0,
                      )
                      .toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </div>
              </div>
            )}

            {/* Incoming bills — cycles that have not completed yet */}
            {incomingBills.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-neutral-800">
                    Incoming Bills
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    <CalendarClock size={12} />
                    {incomingBills.length} upcoming
                  </span>
                </div>

                <div className="space-y-2">
                  {incomingBills.map((bill) => (
                    <div
                      key={bill.bill_id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 px-3 py-2 bg-blue-50/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">
                          {bill.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {bill.due_date} cycle
                          {bill.next_due
                            ? ` · Due ${formatDate(bill.next_due)}`
                            : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-neutral-800 shrink-0">
                        ₱
                        {Number(bill.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                      Upcoming Total
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      ₱
                      {incomingBills
                        .reduce((sum, bill) => sum + Number(bill.amount), 0)
                        .toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
