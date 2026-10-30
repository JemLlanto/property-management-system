// services/auth.ts

import Swal from "sweetalert2";
import { authFetch, options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

// Shape of an item as returned by the server (Prisma maps item_id, etc.)
interface ServerItem {
  item_id: number;
  name: string;
  quantity: number;
  price: number | string;
  created_at: string;
  updated_at: string;
}

// Normalizes a server item (item_id) into the client shape (id)
const normalizeItem = (item: ServerItem): ItemDataProps => ({
  id: item.item_id,
  name: item.name,
  quantity: item.quantity,
  price: Number(item.price),
  created_at: item.created_at,
  updated_at: item.updated_at,
});

export interface ItemDataProps {
  id: number;
  name: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface ItemFormDataProps {
  name: string;
  quantity: number | string | null;
  price: number | string | null;
}

export const emptyForm: ItemFormDataProps = {
  name: "",
  quantity: null,
  price: null,
};

export function getChangedFields<T extends object>(
  original: T,
  current: T,
): Partial<T> {
  const changes: Partial<T> = {};

  for (const key in current) {
    if (current[key] !== original[key]) {
      changes[key] = current[key]; // ❌ Error
    }
  }

  return changes;
}

// All in one service for item CRUD operations
export const itemService = async (
  method: string,
  itemId?: number,
  body?: object,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  // Using AbortController to handle request timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Determine the API route based on the method and itemId
    const apiRoute = itemId ? `item/${itemId}` : `item`;
    // Determine Error Message to be displayed
    const errorMessage =
      method === "POST"
        ? "Item Creation Failed"
        : method === "PATCH" || method === "PUT"
          ? "Item Update Failed"
          : method === "DELETE"
            ? "Item Deletion Failed"
            : method === "GET"
              ? "Fetching Item Failed"
              : "Invalid Method";

    const response = await authFetch(
      `${BASE}/${apiRoute}`,
      options(method, body, controller.signal),
    );

    const payload = await response.json();
    const status = response.status;

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: errorMessage,
        text:
          status === 500
            ? "Something went wrong. Please try again."
            : payload.message || "Something went wrong. Please try again.",
      });

      return { success: false, ...payload };
    }

    // Normalize the server response into a consistent `{ success, data }` shape
    if (Array.isArray(payload.items)) {
      return { success: true, data: payload.items.map(normalizeItem) };
    }
    if (payload.item) {
      return { success: true, data: normalizeItem(payload.item) };
    }

    return payload;
  } catch (err) {
    // Check if the error is due to a timeout
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
