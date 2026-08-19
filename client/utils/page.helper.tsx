import { RefObject } from "react";

export const scrollToSection = (section: RefObject<HTMLElement | null>) => {
  section.current?.scrollIntoView({ behavior: "smooth" });
};
