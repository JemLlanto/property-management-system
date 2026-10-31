"use client";
import { logout } from "@/services/auth.service";
import { LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Link from "next/link";

const SideBar = () => {
  const router = useRouter();
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

  return (
    <>
      <nav className="h-full w-70 hidden md:block bg-cyan-400">
        <ul className="h-full w-full bg-(--foreground)/90 text-(--background) flex flex-col items-center gap-2 p-3 pt-20">
          {navLinks.map((link) => (
            <li className="w-full flex" key={link.href}>
              <Link
                className={`w-full transition-all ${
                  pathname === link.href
                    ? "bg-(--background)/20"
                    : "hover:bg-(--background)/5"
                } rounded p-2`}
                href={`${link.href}`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default SideBar;
