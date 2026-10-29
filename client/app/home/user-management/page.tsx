"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import {
  deleteUser,
  emptyUserForm,
  getUsers,
  UserDataProps,
  UserFormDataProps,
} from "@/services/user.service";
import { BuildingDataProps, getBuildings } from "@/services/building.service";
import AddUserModal from "./AddUserModal";
import UserTable from "./UserTable";

const UserManagementPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loading.isLoading);
  const currentUser = useAppSelector((state) => state.userData);

  const [users, setUsers] = useState<UserDataProps[]>([]);
  const [buildings, setBuildings] = useState<BuildingDataProps[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDataProps | null>(null);
  const [form, setForm] = useState<UserFormDataProps>(emptyUserForm);
  const [originalUser, setOriginalUser] =
    useState<UserFormDataProps>(emptyUserForm);
  const [errors, setErrors] = useState<Partial<UserFormDataProps>>({});

  // Checking user authorization and loading the user list
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));
      try {
        const response = await checkUser();
        if (response.success) {
          dispatch(setUser(response.user));

          const userRes = await getUsers();
          setUsers(userRes.users ?? []);

          // Buildings populate the Unit Owner building dropdown
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
    setEditingUser(null);
    setForm(emptyUserForm);
    setOriginalUser(emptyUserForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserDataProps) => {
    const nextForm: UserFormDataProps = {
      email: user.email,
      type: user.type,
      name: user.name ?? "",
      unit_number: user.unit_number ?? "",
      building: user.building ?? null,
    };

    setEditingUser(user);
    setOriginalUser(nextForm);
    setForm(nextForm);
    setErrors({});
    setIsModalOpen(true);
  };

  // Refresh buildings so the occupant counts stay accurate
  const refreshBuildings = async () => {
    try {
      const buildingRes = await getBuildings();
      setBuildings(buildingRes.buildings ?? []);
    } catch (err) {
      console.error("Error refreshing buildings: ", err);
    }
  };

  const handleDelete = async (user: UserDataProps) => {
    const result = await Swal.fire({
      icon: "warning",
      title: `Delete "${user.email}"?`,
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteUser(user.user_id);

      if (response.success) {
        setUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
        // The deleted user's building slot is freed
        refreshBuildings();
        Swal.fire({
          icon: "success",
          title: "User deleted",
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
      <UserTable
        isLoading={isLoading}
        users={users}
        buildings={buildings}
        openAddModal={openAddModal}
        openEditModal={openEditModal}
        handleDelete={handleDelete}
      />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <AddUserModal
          editingUser={editingUser}
          form={form}
          originalUser={originalUser}
          errors={errors}
          buildings={buildings}
          setUsers={setUsers}
          setBuildings={setBuildings}
          setForm={setForm}
          setIsModalOpen={setIsModalOpen}
          setErrors={setErrors}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
