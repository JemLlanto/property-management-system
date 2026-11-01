"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSideBarVisible } from "@/store/sidebarMobileToggleSlice";

// Links only staff (Admin / Super Admin) can see. Unit owners are
// limited to Dashboard, Payments and Settings — matching the server
// RBAC policy.
const STAFF_ONLY_HREFS = [
  "/home/expenses",
  "/home/user-management",
  "/home/building-management",
  "/home/bills-management",
  "/home/violations",
  "/home/settings/audit-logs",
];

const SideBarLinks = () => {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const userType = useAppSelector((state) => state.userData.type);

  const isStaff = userType === "Admin" || userType === "Super Admin";

  const navLinks = [
    { name: "Dashboard", href: "/home" },
    { name: "Payments", href: "/home/payments" },
    { name: "Expenses", href: "/home/expenses" },
    { name: "User Management", href: "/home/user-management" },
    { name: "Building Management", href: "/home/building-management" },
    { name: "Bills Management", href: "/home/bills-management" },
    { name: "Violations", href: "/home/violations" },
    { name: "Audit Logs", href: "/home/settings/audit-logs" },
    { name: "Settings", href: "/home/settings" },
  ].filter((link) => isStaff || !STAFF_ONLY_HREFS.includes(link.href));

  const isLinkActive = (href: string) => {
    if (href === "/home") {
      return pathname === "/home";
    }

    if (href === "/home/settings") {
      return pathname === "/home/settings";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <ul className="h-full w-full bg-(--primary_hover) text-(--background) flex flex-col items-start gap-1 md:gap-2 p-3 pt-16 md:pt-20">
      <h4 className="blocks md:hidden text-(--background) text-start border-b border-(--background)/50 pb-1 mb-1">
        Property Management Portal
      </h4>
      {navLinks.map((link) => {
        const isActive = isLinkActive(link.href);

        return (
          <li className="w-full flex" key={link.href}>
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center rounded p-1 md:p-2 transition-all ${
                isActive ? "bg-(--background)/20" : "hover:bg-(--background)/5"
              }`}
              href={link.href}
              onClick={() => dispatch(toggleSideBarVisible())}
            >
              <p>{link.name}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default SideBarLinks;
