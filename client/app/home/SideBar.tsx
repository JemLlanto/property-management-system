"use client";
import { logout } from "@/services/auth.service";
import { LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Link from "next/link";

const SideBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const userData = useAppSelector((state) => state.userData);
  const isLoading = useAppSelector((state) => state.loading.isLoading);

  const navLinks = [
    { name: "Home", href: "/home" },
    { name: "Dashboard", href: "/home/dashboard" },
    { name: "Settings", href: "/home/settings" },
    { name: "User Management", href: "/home/user-management" },
    { name: "Building Management", href: "/home/building-management" },
    { name: "Bills Management", href: "/home/bills-management" },
  ];

  const handleLogout = async () => {
    try {
      const response = await logout();

      if (response.success) {
        router.push("/");
      }
    } catch (err) {
      console.error("Unexpected error occured.");
    }
  };
  return (
    <>
      <nav className="h-full w-70 bg-cyan-400">
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
