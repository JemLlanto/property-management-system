"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import {
  deleteUser,
  emptyUserForm,
  getUsersPaginated,
  UserDataProps,
  UserFormDataProps,
} from "@/services/user.service";
import { BuildingDataProps, getBuildings } from "@/services/building.service";
import { useSortableColumns } from "@/hooks/useSortableColumns";
import AddUserModal from "./AddUserModal";
import UserDetailsModal from "./UserDetailsModal";
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
  const [viewingUser, setViewingUser] = useState<UserDataProps | null>(null);
  const [form, setForm] = useState<UserFormDataProps>(emptyUserForm);
  const [originalUser, setOriginalUser] =
    useState<UserFormDataProps>(emptyUserForm);
  const [errors, setErrors] = useState<Partial<UserFormDataProps>>({});

  // Pagination + search state. Search is debounced so typing does not
  // fire a request per keystroke.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Column sorting — clicking a header cycles asc → desc → default
  const sortable = useSortableColumns();

  // Sorting changes the row order, so go back to the first page. Both
  // state updates happen in the same handler, so the page and the sort
  // reach the fetch together in one request.
  const handleSort = useCallback(
    (column: string) => {
      sortable.toggleSort(column);
      setPage(1);
    },
    [sortable],
  );

  // Load one page of users, with the current search term
  const loadUsers = useCallback(async () => {
    const result = await getUsersPaginated({
      page,
      pageSize,
      search,
      ...sortable.sortParams,
    });

    setUsers(result.users);
    setTotal(result.total);
    setTotalPages(result.total_pages);
  }, [page, pageSize, search, sortable.sortParams]);

  // Checking user authorization and loading the user list
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));
      try {
        const response = await checkUser();
        if (response.success) {
          dispatch(setUser(response.user));

          await loadUsers();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload users when the page or search changes
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounce the search box — 300ms after the last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // After create/update, refresh the current page of users
  const refreshUsers = async () => {
    await loadUsers();
  };

  const openAddModal = () => {
    setEditingUser(null);
    setForm(emptyUserForm);
    setOriginalUser(emptyUserForm);
    setErrors({});
    setIsModalOpen(true);
  };

  // Open the read-only details modal for a user row
  const openDetailsModal = (user: UserDataProps) => {
    setViewingUser(user);
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
        // The page may now have a row too few
        refreshUsers();
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
        openDetailsModal={openDetailsModal}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        sortable={{ ...sortable, toggleSort: handleSort }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full mx-auto mt-3 flex items-center justify-between text-sm text-neutral-600">
          <span>
            {total} user{total === 1 ? "" : "s"} · Page {page} of {totalPages}
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

      {/* Details Modal */}
      {viewingUser && (
        <UserDetailsModal
          user={viewingUser}
          buildings={buildings}
          onClose={() => setViewingUser(null)}
          onEdit={openEditModal}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <AddUserModal
          editingUser={editingUser}
          form={form}
          originalUser={originalUser}
          errors={errors}
          buildings={buildings}
          users={users}
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
