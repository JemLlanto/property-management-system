// services/audit.service.tsx

import Swal from "sweetalert2";
import { authFetch, options } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 15000;

// One append-only audit entry. before_state/after_state hold the entity
// snapshot around the change (passwords and refresh tokens are redacted
// server-side).
export interface AuditLogProps {
  audit_id: number;
  actor_id: string | null;
  actor_name: string | null;
  action: "create" | "update" | "delete";
  entity_type: "bill" | "payment" | "user" | "building";
  entity_id: string | null;
  summary: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditTrailResultProps {
  success: boolean;
  logs: AuditLogProps[];
  page: number;
  pageSize: number;
  total: number;
  total_pages: number;
}

// Load a page of the audit trail. All filters are optional.
export const getAuditTrail = async (
  {
    page = 1,
    pageSize = 50,
    entity_type,
    actor_id,
    search,
  }: {
    page?: number;
    pageSize?: number;
    entity_type?: string;
    actor_id?: string;
    search?: string;
  } = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<AuditTrailResultProps> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (entity_type) params.set("entity_type", entity_type);
  if (actor_id) params.set("actor_id", actor_id);
  if (search) params.set("search", search);

  try {
    const response = await authFetch(
      `${BASE}/audit?${params.toString()}`,
      options("GET", undefined, controller.signal),
    );

    const payload = await response.json();

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Fetching Audit Trail Failed",
        text: payload.message || "Something went wrong. Please try again.",
      });

      return {
        success: false,
        logs: [],
        page: 1,
        pageSize,
        total: 0,
        total_pages: 0,
      };
    }

    return {
      success: true,
      logs: payload.logs ?? [],
      page: payload.page ?? 1,
      pageSize: payload.pageSize ?? pageSize,
      total: payload.total ?? 0,
      total_pages: payload.total_pages ?? 0,
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
