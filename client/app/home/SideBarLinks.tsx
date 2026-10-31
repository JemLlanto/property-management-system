"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const SideBarLinks = () => {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/home" },
    { name: "Payments", href: "/home/payments" },
    { name: "Expenses", href: "/home/expenses" },
    { name: "User Management", href: "/home/user-management" },
    { name: "Building Management", href: "/home/building-management" },
    { name: "Bills Management", href: "/home/bills-management" },
    { name: "Audit Logs", href: "/home/settings/audit-logs" },
    { name: "Settings", href: "/home/settings" },
  ];

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
    <ul className="h-full w-full bg-(--primary_hover) text-(--background) flex flex-col items-center gap-2 p-3 pt-17 md:pt-20">
      {navLinks.map((link) => {
        const isActive = isLinkActive(link.href);

        return (
          <li className="w-full flex" key={link.href}>
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center rounded p-2 transition-all ${
                isActive ? "bg-(--background)/20" : "hover:bg-(--background)/5"
              }`}
              href={link.href}
            >
              {link.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default SideBarLinks;
