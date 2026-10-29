// services/user.service.tsx

import Swal from "sweetalert2";
import { options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

export const USER_TYPES = ["Unit Owner", "Admin", "Super Admin"] as const;

export type UserType = (typeof USER_TYPES)[number];

export interface UserDataProps {
  user_id: string;
  email: string;
  type: UserType;
  name: string | null;
  unit_number: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserFormDataProps {
  // Optional — when blank and the name is also blank, the unit number is
  // used as both the username and the password.
  email: string;
  type: UserType;
  name: string;
  unit_number: string;
}

export const emptyUserForm: UserFormDataProps = {
  email: "",
  type: "Unit Owner",
  name: "",
  unit_number: "",
};

// Unit number is only mandatory for Unit Owner accounts
export const requiresUnitNumber = (type: UserType): boolean =>
  type === "Unit Owner";

// List every user in the system
export const getUsers = async (timeoutMs: number = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${BASE}/users`,
      options("GET", undefined, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetching Users Failed",
        text: payload.message || "Something went wrong. Please try again.",
      });

      return { success: false, users: [] };
    }

    return { success: true, users: payload.users ?? [] };
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

// Create a new user. The server returns a one-time temporary password.
export const createUser = async (
  formData: UserFormDataProps,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${BASE}/users`,
      options("POST", formData, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "User Creation Failed",
        text: payload.message || "Something went wrong. Please try again.",
      });

      return payload;
    }

    return payload;
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

// Update an existing user
export const updateUser = async (
  userId: string,
  formData: Partial<UserFormDataProps>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${BASE}/users/${userId}`,
      options("PATCH", formData, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "User Update Failed",
        text: payload.message || "Something went wrong. Please try again.",
      });

      return payload;
    }

    return payload;
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

// Delete a user
export const deleteUser = async (
  userId: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${BASE}/users/${userId}`,
      options("DELETE", undefined, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "User Deletion Failed",
        text: payload.message || "Something went wrong. Please try again.",
      });

      return payload;
    }

    return payload;
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
