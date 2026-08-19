import { AuthProps, getMe } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

export const checkUser = async () => {
  const data = await getMe();
  if (data.success) {
    // console.log("Authorized");
    // console.log(data);
    return data;
  } else {
    // console.log("Not authorized");
    // console.log(data);
    return data;
  }
};

export const handleChange = (
  field: keyof AuthProps,
  value: string | number | null,
  setFormData: Dispatch<SetStateAction<AuthProps>>,
) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validateEmail = (
  email: string,
  setFormError: Dispatch<SetStateAction<string>>,
): boolean => {
  if (!email.trim()) {
    setFormError("Email is required");
    return false;
  }

  if (!isValidEmail(email)) {
    setFormError("Please enter a valid email address");
    return false;
  }

  setFormError("");
  return true;
};

export const passwordChecks = (password: string) => ({
  minLength: password.length >= 10, // match whatever Laravel requires
  case: /^(?=.*[a-z])(?=.*[A-Z])/.test(password),
  number: /\d/.test(password),
});
