import { useRegister } from "@/hooks/userRegister";
import { AuthProps, register } from "@/services/auth.service";
import { FormErrors, validate } from "@/utils/auth.helper";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";

interface Props {
  open: boolean;
  handleClose: () => void;
}

export default function RegisterModal({ open, handleClose }: Props) {
  const { handleRegister } = useRegister();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [formData, setFormData] = useState<AuthProps>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleModalClose = () => {
    setFormData({ username: "", password: "" });
    setErrors({});
    setLoading(false);
    handleClose();
  };
  const handleChange = (
    field: keyof AuthProps,
    value: string | number | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const onSubmit = () => {
    handleRegister(formData, validate, setErrors, setLoading, handleModalClose);
  };
  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={handleModalClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">Create Admin</DialogTitle>
      <DialogContent className="flex flex-col justify-center items-center gap-3">
        {/* 6. Surface general errors visibly */}
        {errors.general && <Alert severity="error">{errors.general}</Alert>}

        <TextField
          className="w-100"
          label="Username"
          variant="filled"
          value={formData.username}
          onChange={(e) => handleChange("username", e.target.value)}
          error={!!errors.username}
          helperText={errors.username}
          autoComplete="username"
          disabled={loading}
        />
        <TextField
          className="w-100"
          label="Password"
          type="password"
          variant="filled"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          error={!!errors.password}
          helperText={errors.password}
          autoComplete="current-password" // 7. Correct autocomplete hint
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <div className="pe-4 pb-4">
          <button
            className="min-w-30 bg-(--primary) hover:bg-(--primary_hover) rounded text-neutral-50 py-1 px-2 transition duration-300 ease-in-out cursor-pointer"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <p>Register</p>
            )}
          </button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
