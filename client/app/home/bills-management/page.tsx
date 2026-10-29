"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import {
  BillDataProps,
  BillFormDataProps,
  deleteBill,
  emptyBillForm,
  getBills,
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

  // Checking user authorization and loading the bill list
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));
      try {
        const response = await checkUser();
        if (response.success) {
          dispatch(setUser(response.user));

          const billRes = await getBills();
          setBills(billRes.bills ?? []);

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
  }, []);

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
      />

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
