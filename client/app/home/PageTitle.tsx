"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Maps route paths to their page titles. Update this list when adding pages.
const routeTitles: Record<string, string> = {
  "/home": "Home",
  "/home/user-management": "User Management",
  "/home/building-management": "Building Management",
  "/home/dashboard": "Dashboard",
  "/home/settings": "Settings",
};

const PageTitle = () => {
  const pathname = usePathname();

  useEffect(() => {
    const pageTitle = routeTitles[pathname];

    document.title = pageTitle
      ? `${pageTitle} | Property Management System`
      : "Property Management System";
  }, [pathname]);

  return null;
};

export default PageTitle;
