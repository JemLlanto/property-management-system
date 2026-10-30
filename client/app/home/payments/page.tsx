"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import {
  PaymentDataProps,
  PaymentFormDataProps,
  deletePayment,
  emptyPaymentForm,
  getPaymentsPaginated,
} from "@/services/payment.service";
import { getBills, BillDataProps } from "@/services/bill.service";
import { BuildingDataProps, getBuildings } from "@/services/building.service";
import { getUsers, UserDataProps } from "@/services/user.service";
import PaymentModal from "./PaymentModal";
import PaymentTable from "./PaymentTable";

const PaymentsPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loading.isLoading);

  const [payments, setPayments] = useState<PaymentDataProps[]>([]);
  const [bills, setBills] = useState<BillDataProps[]>([]);
  const [users, setUsers] = useState<UserDataProps[]>([]);
  const [buildings, setBuildings] = useState<BuildingDataProps[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<PaymentFormDataProps>(emptyPaymentForm);
  const [errors, setErrors] = useState<Partial<PaymentFormDataProps>>({});

  // Pagination + search state. Search is debounced so typing does not
  // fire a request per keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Only Unit Owner accounts can have payments recorded against them
  const unitOwners = useMemo(
    () => users.filter((u) => u.type === "Unit Owner"),
    [users],
  );

  // Load one page of payments, plus the lookup data the table needs
  // (bills, unit owners and buildings are small — fetched in full).
  const loadPayments = useCallback(async () => {
    const result = await getPaymentsPaginated({ page, pageSize, search });

    setPayments(result.payments);
    setTotal(result.total);
    setTotalPages(result.total_pages);
  }, [page, pageSize, search]);

  // Checking user authorization and loading payments plus lookup data
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));
      try {
        const response = await checkUser();
        if (response.success) {
          dispatch(setUser(response.user));

          const [, billRes, userRes, buildingRes] = await Promise.all([
            loadPayments(),
            getBills(),
            getUsers(),
            getBuildings(),
          ]);

          setBills(billRes.bills ?? []);
          setUsers(userRes.users ?? []);
          setBuildings(buildingRes.buildings ?? []);
        } else {
          // Redirect to the landing page if not authenticated.
          router.push(`/`);
        }
      } catch (err) {
        console.error("Error: ", err);
      } finally {
        dispatch(setIsLoading(false));
      }
    };

    validateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload payments when the page or search changes
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Debounce the search box — 300ms after the last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // a new search restarts at the first page
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const openAddModal = () => {
    setForm(emptyPaymentForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (payment: PaymentDataProps) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this payment record?",
      html: `Unit <b>${payment.unit_number ?? "—"}</b> · ${
        payment.bill_name ?? "—"
      } · ₱${Number(payment.amount).toLocaleString()}<br/>This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deletePayment(payment.payment_id);

      if (response.success) {
        setPayments((prev) =>
          prev.filter((p) => p.payment_id !== payment.payment_id),
        );
        Swal.fire({
          icon: "success",
          title: "Payment deleted",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Unexpected Error: ", err);
    }
  };

  return (
    <div className="pt-2">
      {/* Search */}
      <div className="w-full mx-auto mb-3 max-w-md">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by unit number, bill or recorder..."
            className="w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800"
          />
        </div>
      </div>

      <PaymentTable
        isLoading={isLoading}
        payments={payments}
        buildings={buildings}
        unitOwners={unitOwners}
        openAddModal={openAddModal}
        handleDelete={handleDelete}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full mx-auto mt-3 flex items-center justify-between text-sm text-neutral-600">
          <span>
            {total} payment{total === 1 ? "" : "s"} · Page {page} of{" "}
            {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isModalOpen && (
        <PaymentModal
          bills={bills}
          unitOwners={unitOwners}
          form={form}
          errors={errors}
          setPayments={setPayments}
          setForm={setForm}
          setIsModalOpen={setIsModalOpen}
          setErrors={setErrors}
        />
      )}
    </div>
  );
};

export default PaymentsPage;
