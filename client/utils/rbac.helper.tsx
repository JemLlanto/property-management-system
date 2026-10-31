"use client";

import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Client-side guard for pages Unit Owners must not reach. The server
// RBAC middleware is the real enforcement — this only keeps owners from
// landing on a page they cannot use.
//
// Usage: call at the top of a restricted page component.
//   useStaffOnlyPage();
//
// While the user state is still loading (empty type) it waits rather
// than redirecting, so a refresh on a staff page does not bounce.
const STAFF_TYPES = ["Admin", "Super Admin"];

export function useStaffOnlyPage() {
  const router = useRouter();
  const userType = useAppSelector((state) => state.userData.type);

  const isStaff = STAFF_TYPES.includes(userType);
  const isLoaded = userType !== "";

  useEffect(() => {
    if (isLoaded && !isStaff) {
      router.replace("/home");
    }
  }, [isLoaded, isStaff, router]);

  return { isStaff, isLoaded };
}
