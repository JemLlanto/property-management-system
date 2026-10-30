// services/user.service.tsx

import Swal from "sweetalert2";
import { authFetch, options } from "./auth.service";

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
  building: number | null;
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
  // Building id — required for Unit Owner accounts
  building: number | string | null;
}

export const emptyUserForm: UserFormDataProps = {
  email: "",
  type: "Unit Owner",
  name: "",
  unit_number: "",
  building: null,
};

// Unit number is only mandatory for Unit Owner accounts
export const requiresUnitNumber = (type: UserType): boolean =>
  type === "Unit Owner";

// Pagination metadata returned alongside a page of results
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

// Query parameters accepted by the paginated list endpoints
export interface ListQueryProps {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  sort?: string;
  order?: "asc" | "desc";
}

// Build a query string from the list parameters, skipping empty values.
const buildQuery = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;

    query.set(key, String(value));
  }

  return query.toString();
};

// List every user in the system
export const getUsers = async (timeoutMs: number = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await authFetch(
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

// A page of users, with an optional search term and type filter.
export const getUsersPaginated = async (
  query: ListQueryProps = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const search = buildQuery({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    type: query.type,
    sort: query.sort,
    order: query.order,
  });

  try {
    const response = await authFetch(
      `${BASE}/users${search ? `?${search}` : ""}`,
      options("GET", undefined, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetching Users Failed",
        text: payload.message || "Something went wrong. Please try again.",
      });

      return {
        success: false,
        users: [],
        page: 1,
        pageSize: 0,
        total: 0,
        total_pages: 0,
        has_more: false,
      };
    }

    return {
      success: true,
      users: payload.users ?? [],
      page: payload.page ?? 1,
      pageSize: payload.pageSize ?? 0,
      total: payload.total ?? 0,
      total_pages: payload.total_pages ?? 0,
      has_more: payload.has_more ?? false,
    };
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
    const response = await authFetch(
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
    const response = await authFetch(
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
    const response = await authFetch(
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
