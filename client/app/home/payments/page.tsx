"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import {
  PaymentDataProps,
  PaymentFormDataProps,
  deletePayment,
  emptyPaymentForm,
  getPayments,
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

  // Only Unit Owner accounts can have payments recorded against them
  const unitOwners = useMemo(
    () => users.filter((u) => u.type === "Unit Owner"),
    [users],
  );

  // Checking user authorization and loading payments plus lookup data
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));
      try {
        const response = await checkUser();
        if (response.success) {
          dispatch(setUser(response.user));

          const [paymentRes, billRes, userRes, buildingRes] = await Promise.all(
            [getPayments(), getBills(), getUsers(), getBuildings()],
          );

          setPayments(paymentRes.payments ?? []);
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
  }, []);

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
      <PaymentTable
        isLoading={isLoading}
        payments={payments}
        buildings={buildings}
        unitOwners={unitOwners}
        openAddModal={openAddModal}
        handleDelete={handleDelete}
      />

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
