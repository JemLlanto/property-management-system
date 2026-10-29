"use client";

import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import {
  BuildingDataProps,
  BuildingFormDataProps,
  deleteBuilding,
  emptyBuildingForm,
  getBuildings,
} from "@/services/building.service";
import BuildingModal from "./BuildingModal";
import BuildingTable from "./BuildingTable";

const BuildingManagementPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loading.isLoading);

  const [buildings, setBuildings] = useState<BuildingDataProps[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingDataProps | null>(
    null,
  );
  const [form, setForm] =
    useState<BuildingFormDataProps>(emptyBuildingForm);
  const [errors, setErrors] = useState<Partial<BuildingFormDataProps>>({});

  // Checking user authorization and loading the building list
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));
      try {
        const response = await checkUser();
        if (response.success) {
          dispatch(setUser(response.user));

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
    setEditingBuilding(null);
    setForm(emptyBuildingForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (building: BuildingDataProps) => {
    setEditingBuilding(building);
    setForm({
      name: building.name,
      capacity: building.capacity,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (building: BuildingDataProps) => {
    const result = await Swal.fire({
      icon: "warning",
      title: `Delete "${building.name}"?`,
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteBuilding(building.building_id);

      if (response.success) {
        setBuildings((prev) =>
          prev.filter((b) => b.building_id !== building.building_id),
        );
        Swal.fire({
          icon: "success",
          title: "Building deleted",
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
      <BuildingTable
        isLoading={isLoading}
        buildings={buildings}
        openAddModal={openAddModal}
        openEditModal={openEditModal}
        handleDelete={handleDelete}
      />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <BuildingModal
          editingBuilding={editingBuilding}
          form={form}
          errors={errors}
          setBuildings={setBuildings}
          setForm={setForm}
          setIsModalOpen={setIsModalOpen}
          setErrors={setErrors}
        />
      )}
    </div>
  );
};

export default BuildingManagementPage;
