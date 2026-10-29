"use client";
import { useEffect, useRef, useState } from "react";
import { web_data } from "@/utils/data.helper";
import { scrollToSection } from "@/utils/page.helper";
import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const homeRef = useRef<HTMLElement | null>(null);
  const hoursRef = useRef<HTMLElement | null>(null);
  const locationRef = useRef<HTMLElement | null>(null);
  const reviewsRef = useRef<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    router.push(`/auth/login`);
  }, []);

  return <></>;
}
