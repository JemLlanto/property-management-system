// services/building.service.tsx

import Swal from "sweetalert2";
import { options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

export interface BuildingDataProps {
  building_id: number;
  name: string;
  capacity: number;
  occupants: number;
  created_at?: string;
  updated_at?: string;
}

export interface BuildingFormDataProps {
  name: string;
  capacity: number | string | null;
}

export const emptyBuildingForm: BuildingFormDataProps = {
  name: "",
  capacity: null,
};

const errorMessage = (method: string) => {
  switch (method) {
    case "POST":
      return "Building Creation Failed";
    case "PATCH":
    case "PUT":
      return "Building Update Failed";
    case "DELETE":
      return "Building Deletion Failed";
    default:
      return "Fetching Buildings Failed";
  }
};

// Shared request helper — handles timeouts, error toasts and JSON parsing
const request = async (
  method: string,
  path: string,
  body?: object,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${BASE}/buildings${path}`,
      options(method, body, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: errorMessage(method),
        text:
          response.status === 500
            ? "Something went wrong. Please try again."
            : payload.message || "Something went wrong. Please try again.",
      });

      return { success: false, ...payload };
    }

    return { success: true, ...payload };
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";

    Swal.fire({
      icon: "error",
      title: isTimeout ? "Request Timed Out" : "Network Error",
      text: isTimeout
        ? "The server took too long to respond. Please try again."
        : "Something went wrong. Please try again.",
    });

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

// List all buildings
export const getBuildings = async (timeoutMs: number = DEFAULT_TIMEOUT_MS) => {
  const result = await request("GET", "", undefined, timeoutMs);

  return { success: result.success, buildings: result.buildings ?? [] };
};

// Create a building
export const createBuilding = async (
  formData: BuildingFormDataProps,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) =>
  request(
    "POST",
    "",
    { name: formData.name, capacity: Number(formData.capacity) },
    timeoutMs,
  );

// Update a building
export const updateBuilding = async (
  buildingId: number,
  formData: Partial<BuildingFormDataProps>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const body: { name?: string; capacity?: number } = {};

  if (formData.name !== undefined) body.name = formData.name;
  if (formData.capacity !== undefined && formData.capacity !== null) {
    body.capacity = Number(formData.capacity);
  }

  return request("PATCH", `/${buildingId}`, body, timeoutMs);
};

// Delete a building
export const deleteBuilding = async (
  buildingId: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => request("DELETE", `/${buildingId}`, undefined, timeoutMs);
