// services/auth.ts

import Swal from "sweetalert2";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

export interface AuthProps {
  username?: string;
  email: string;
  // Login identifier — may be an email, unit number, or display name
  identifier?: string;
  password: string;
}

// Shape returned by the server
interface ServerUser {
  user_id?: string;
  id?: string;
  username?: string;
  email: string;
  type?: string;
  name?: string | null;
  unit_number?: string | null;
  building?: number | null;
}

// Normalizes the server user payload into the shape the Redux store expects
const normalizeUser = (user: ServerUser) => ({
  id: user.user_id ?? user.id ?? "",
  username: user.username ?? user.name ?? "",
  email: user.email ?? "",
  type: user.type ?? "",
  name: user.name ?? "",
  unit_number: user.unit_number ?? "",
  building: user.building ?? null,
});

// credentials: 'include' is CRITICAL — it tells fetch to send/receive cookies
// Without it, the browser won't attach the httpOnly cookie to requests
export const options = (
  method: string,
  body?: object,
  signal?: AbortSignal,
) => ({
  method,
  credentials: "include" as RequestCredentials,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  ...(body && { body: JSON.stringify(body) }),
  ...(signal && { signal }),
});

export const register = async (
  formData: AuthProps,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { username, email, password } = formData;

    // console.log("email, password: ", email, password);

    const response = await fetch(
      `${BASE}/auth/register`,
      options("POST", { username, email, password }, controller.signal),
    );
    // console.log("response: ", response.status);

    const data = await response.json();
    // Getting the value of response status
    const status = response.status;
    // console.log("data: ", data, status);

    if (!response.ok) {
      // Closing modal to see the error message
      Swal.fire({
        icon: "error",
        title: "Account Creation Failed",
        text:
          status === 500
            ? "Something went wrong. Please try again."
            : data.message || "Something went wrong. Please try again.",
      });

      return data;
    }

    return { ...data, user: data.user ? normalizeUser(data.user) : undefined };
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

export const login = async (
  formData: AuthProps,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  const { email, identifier, password } = formData;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${BASE}/auth/login`,
      options(
        "POST",
        { identifier: identifier ?? email, password },
        controller.signal,
      ),
    );

    const data = await response.json();

    if (!response.ok) {
      console.log("response: ", response);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text:
          response.status === 500
            ? "Something went wrong. Please try again."
            : "Invalid credentials.",
      });

      return data;
    }

    return { ...data, user: data.user ? normalizeUser(data.user) : undefined };
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

// No token to clear manually — the server sends an expired cookie
export const logout = async () => {
  const response = await fetch(`${BASE}/auth/logout`, options("POST"));
  const data = await response.json();
  // console.log("data: ", data);

  return data;
};

export const getMe = () =>
  fetch(`${BASE}/auth/me`, options("GET"))
    .then((r) => r.json())
    .then((data) =>
      data?.user ? { ...data, user: normalizeUser(data.user) } : data,
    );
