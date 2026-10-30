"use client";

import { checkUser } from "@/utils/auth.helper";
import { changePassword } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userDataSlice";
import { setIsLoading } from "@/store/isLoading.slice";
import { Eye, EyeClosed, KeyRound, User } from "lucide-react";

const SettingsPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.loading.isLoading);
  const userData = useAppSelector((state) => state.userData);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checking user authorization and loading the current profile
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));

      try {
        const response = await checkUser();

        if (response.success) {
          dispatch(setUser(response.user));
        } else {
          router.push(`/`);
        }
      } catch (err) {
        console.error("Error: ", err);
      } finally {
        dispatch(setIsLoading(false));
      }
    };

    validateUser();
  }, [dispatch, router]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!currentPassword) {
      nextErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      nextErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = "New password must be at least 8 characters";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your new password";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await changePassword(currentPassword, newPassword);

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Password changed",
          text: response.message,
        }).then(() => {
          // Every session was revoked server-side — send the user back
          // to the sign-in screen.
          router.push(`/`);
        });
      }
    } catch (err) {
      console.error("Error Occurred: ", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError?: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
      hasError ? "border-red-400" : "border-neutral-300"
    }`;

  return (
    <div className="pt-2 pb-10 space-y-4 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-800">Settings</h2>
        <p className="text-sm text-neutral-500">
          Manage your account details and password.
        </p>
      </div>

      {/* Account details */}
      <section className="w-full bg-white border border-gray-200 rounded-xl shadow-sm font-sans p-5">
        <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <User size={18} />
          Account
        </h3>

        <dl className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-y-3 gap-x-4 text-sm">
          <dt className="text-neutral-500">Name</dt>
          <dd className="text-neutral-800">
            {userData.name || userData.username || "—"}
          </dd>

          <dt className="text-neutral-500">Email</dt>
          <dd className="text-neutral-800 break-all">
            {userData.email || "—"}
          </dd>

          <dt className="text-neutral-500">Role</dt>
          <dd className="text-neutral-800">{userData.type || "—"}</dd>

          <dt className="text-neutral-500">Unit Number</dt>
          <dd className="text-neutral-800">{userData.unit_number || "—"}</dd>
        </dl>
      </section>

      {/* Change password */}
      <section className="w-full bg-white border border-gray-200 rounded-xl shadow-sm font-sans p-5">
        <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2 mb-1">
          <KeyRound size={18} />
          Change Password
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Changing your password signs you out of every device.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              type={passwordVisible ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass(errors.currentPassword)}
              placeholder="Your current password"
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass(errors.newPassword)} pr-10`}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                aria-label={
                  passwordVisible ? "Hide passwords" : "Show passwords"
                }
              >
                {passwordVisible ? <EyeClosed size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type={passwordVisible ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass(errors.confirmPassword)}
              placeholder="Repeat the new password"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading}
          className="mt-5 w-full rounded-lg bg-neutral-900 text-white text-sm font-medium py-2 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Updating..." : "Change Password"}
        </button>
      </section>
    </div>
  );
};

export default SettingsPage;
