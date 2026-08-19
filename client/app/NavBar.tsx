import { nav_menu } from "@/utils/style.helper";
import { RefObject } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
interface Props {
  scrollToSection: (section: RefObject<HTMLElement | null>) => void;
  refs: {
    homeRef: RefObject<HTMLElement | null>;
    hoursRef: RefObject<HTMLElement | null>;
    locationRef: RefObject<HTMLElement | null>;
    reviewsRef: RefObject<HTMLElement | null>;
  };
}
export default function NavBar({ scrollToSection, refs }: Props) {
  return (
    <motion.nav
      className="fixed top-0 left-0 w-full min-h-15 bg-(--background) shadow flex justify-between items-center p-2 px-25 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      <div>
        <h4
          className="text-(--primary) cursor-pointer"
          onClick={() => {
            scrollToSection(refs.homeRef);
          }}
        >
          NEXT.JS & LARAVEL BOILER PLATE
        </h4>
      </div>

      <div className="flex gap-15">
        <ul className="flex justify-center items-center gap-15">
          <li>
            <p
              className={nav_menu}
              onClick={() => {
                scrollToSection(refs.homeRef);
              }}
            >
              Home
            </p>
          </li>
          <li>
            <p
              className={nav_menu}
              onClick={() => {
                scrollToSection(refs.hoursRef);
              }}
            >
              About
            </p>
          </li>

          <li>
            <p
              className={nav_menu}
              onClick={() => {
                scrollToSection(refs.reviewsRef);
              }}
            >
              Services
            </p>
          </li>
        </ul>
        <ul className="flex items-center gap-5">
          <li>
            <Link
              href={`/auth/register`}
              onClick={() => {
                scrollToSection(refs.reviewsRef);
              }}
            >
              <p className="border border-(--primary) text-(--primary) rounded-[10px] px-7 py-1 hover:bg-(--primary) hover:text-(--background) transform duration-200 ease-in-out cursor-pointer">
                Sign Up
              </p>
            </Link>
          </li>
          <li>
            <Link href={`/auth/login`}>
              <p className="border border-(--primary) bg-(--primary) text-(--background) rounded-[10px] px-7 py-1 hover:bg-(--primary_hover) transform duration-200 ease-in-out cursor-pointer">
                Sign In
              </p>
            </Link>
          </li>
        </ul>
      </div>
    </motion.nav>
  );
}
