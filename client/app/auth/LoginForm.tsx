"use client";
import Image from "next/image";
import facebookIcon from "@/public/facebook.png";
import googleIcon from "@/public/search.png";
import { AuthProps, login } from "@/services/auth.service";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { RootState } from "@/store";
import { togglePasswordVisible } from "@/store/passwordToggleSlice";
import { Eye, EyeClosed } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const LoginForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<AuthProps>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const passwordVisible = useAppSelector(
    (state: RootState) => state.password.passwordVisible,
  );

  const isValid = formData.email && formData.password;

  const handleLogin = async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      const data = await login(formData);

      if (data.success) {
        // console.log("Logged in!", data.message); // "Logged in successfully."
        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: data.message,
        }).then(() => {
          router.push(`/home`);
        });
      }
    } catch (error) {
      console.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (
    field: keyof AuthProps,
    value: string | number | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  return (
    <>
      <div className="text-center mb-4">
        <h4 className="text-3xl font-bold">Welcome!</h4>
        <p className="text-gray-500 mt-1">
          Sign in to continue to your account
        </p>
      </div>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="text"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            {/* PASSWORD VISIBILITY TOGGLER */}
            <label
              htmlFor="password"
              className="absolute h-full w-full flex items-center justify-end pe-5"
            >
              <span onClick={(e) => dispatch(togglePasswordVisible())}>
                {passwordVisible ? (
                  <Eye className="text-(--foreground)/70 hover:text-(--foreground) transition duration-200 ease-in-out cursor-pointer" />
                ) : (
                  <EyeClosed className="text-(--foreground)/70 hover:text-(--foreground) transition duration-200 ease-in-out cursor-pointer" />
                )}
              </span>
            </label>
            <input
              id="password"
              type={passwordVisible ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>

          <button type="button" className="text-blue-500 hover:underline">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !isValid}
          className="w-full bg-(--primary) text-white py-3 rounded-lg font-semibold disabled:bg-(--primary_hover)/50 hover:bg-(--primary_hover) transition cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Authenticating..." : "Login to Your Account"}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-sm text-gray-500">or continue with</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <div className="flex justify-center items-center gap-5">
        <button
          type="button"
          className="size-8 cursor-pointer hover:scale-102 transition duration-200 ease-in-out"
        >
          <Image
            src={facebookIcon}
            alt="Facebook Icon"
            className="size-full object-contain"
          />
        </button>

        <button
          type="button"
          className="size-8 cursor-pointer hover:scale-102 transition duration-200 ease-in-out"
        >
          <Image
            src={googleIcon}
            alt="Facebook Icon"
            className="size-full object-contain"
          />
        </button>
      </div>

      <div className="text-center mt-6 text-sm">
        <span className="text-gray-500">Don't have an account?</span>{" "}
        <button
          type="button"
          className="text-blue-500 font-medium hover:underline"
        >
          <Link href="/auth/register">Sign up</Link>
        </button>
      </div>
    </>
  );
};

export default LoginForm;
