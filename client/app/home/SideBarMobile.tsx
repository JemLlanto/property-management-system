"use client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toggleSideBarVisible } from "@/store/sidebarMobileToggleSlice";
import SideBarLinks from "./SideBarLinks";

const SideBarMobile = () => {
  const dispatch = useAppDispatch();
  const sideBarVisible = useAppSelector(
    (state: RootState) => state.sideBar.sideBarVisible,
  );

  return (
    <>
      <nav
        className={`fixed ${sideBarVisible ? "left-0" : "-left-75"} h-full w-70 block md:hidden transition-all duration-300 ease-in-out z-2`}
      >
        <button
          type="button"
          aria-label={sideBarVisible ? "Hide menu" : "Show menu"}
          className={`absolute top-16.5 -right-4 size-9 md:size-10 bg-(--primary_hover) text-(--background) flex md:hidden justify-center items-center rounded-full border-2 px-2 transition duration-200 cursor-pointer z-2`}
          onClick={() => dispatch(toggleSideBarVisible())}
        >
          {sideBarVisible ? (
            <ChevronLeft size={17} strokeWidth={3} />
          ) : (
            <ChevronRight size={17} strokeWidth={3} />
          )}
        </button>
        <SideBarLinks />
      </nav>
    </>
  );
};

export default SideBarMobile;
