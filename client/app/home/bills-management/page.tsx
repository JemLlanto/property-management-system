"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import {
  BillDataProps,
  BillFormDataProps,
  deleteBill,
  emptyBillForm,
  getBillsPaginated,
} from "@/services/bill.service";
import { BuildingDataProps, getBuildings } from "@/services/building.service";
import BillDetailsModal from "./BillDetailsModal";
import BillModal from "./BillModal";
import BillTable from "./BillTable";

const BillsManagementPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loading.isLoading);

  const [bills, setBills] = useState<BillDataProps[]>([]);
  const [buildings, setBuildings] = useState<BuildingDataProps[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingBill, setViewingBill] = useState<BillDataProps | null>(null);
  const [editingBill, setEditingBill] = useState<BillDataProps | null>(null);
  const [form, setForm] = useState<BillFormDataProps>(emptyBillForm);
  const [errors, setErrors] = useState<Partial<BillFormDataProps>>({});

  // Pagination + search state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadBills = useCallback(async () => {
    const result = await getBillsPaginated({ page, pageSize, search });

    setBills(result.bills);
    setTotal(result.total);
    setTotalPages(result.total_pages);
  }, [page, pageSize, search]);

  // Checking user authorization and loading the bill list
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));
      try {
        const response = await checkUser();
        if (response.success) {
          dispatch(setUser(response.user));

          await loadBills();

          // Buildings resolve the building names shown in the details modal
          const buildingRes = await getBuildings();
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

  // Reload bills when the page or search changes
  useEffect(() => {
    loadBills();
  }, [loadBills]);

  // Debounce the search box — 300ms after the last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // After create/update, refresh the current page of bills
  const refreshBills = async () => {
    await loadBills();
  };

  const openAddModal = () => {
    setEditingBill(null);
    setForm(emptyBillForm);
    setErrors({});
    setIsModalOpen(true);
  };

  // Open the read-only details modal showing payment standing per unit
  const openDetailsModal = (bill: BillDataProps) => {
    setViewingBill(bill);
  };

  const openEditModal = (bill: BillDataProps) => {
    setEditingBill(bill);
    setForm({
      name: bill.name,
      due_date: bill.due_date ?? "",
      amount: bill.amount,
      discount_percent: bill.discount_percent ?? 0,
      late_fee_amount: bill.late_fee_amount ?? 0,
      late_fee_type: bill.late_fee_type ?? "fixed",
      late_fee_grace_days: bill.late_fee_grace_days ?? 0,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (bill: BillDataProps) => {
    const result = await Swal.fire({
      icon: "warning",
      title: `Delete "${bill.name}"?`,
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteBill(bill.bill_id);

      if (response.success) {
        setBills((prev) => prev.filter((b) => b.bill_id !== bill.bill_id));
        refreshBills();
        Swal.fire({
          icon: "success",
          title: "Bill deleted",
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
      <BillTable
        isLoading={isLoading}
        bills={bills}
        openAddModal={openAddModal}
        openEditModal={openEditModal}
        handleDelete={handleDelete}
        openDetailsModal={openDetailsModal}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full mx-auto mt-3 flex items-center justify-between text-sm text-neutral-600">
          <span>
            {total} bill{total === 1 ? "" : "s"} · Page {page} of {totalPages}
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

      {/* Details Modal — payment standing per unit */}
      {viewingBill && (
        <BillDetailsModal
          billId={viewingBill.bill_id}
          buildings={buildings}
          onClose={() => setViewingBill(null)}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <BillModal
          editingBill={editingBill}
          form={form}
          errors={errors}
          setBills={setBills}
          setForm={setForm}
          setIsModalOpen={setIsModalOpen}
          setErrors={setErrors}
        />
      )}
    </div>
  );
};

export default BillsManagementPage;
