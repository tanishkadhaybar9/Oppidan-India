import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Building, Mail, ArrowRight, Info } from "lucide-react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { PasswordInput } from "../components/auth/PasswordInput";
import { PasswordStrength } from "../components/auth/PasswordStrength";
import { AuthButton } from "../components/auth/AuthButton";
import { AuthAlert } from "../components/auth/AuthAlert";
import { useAuth } from "../hooks/useAuth";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Full name must be at least 2 characters";
    }

    if (!formData.companyName.trim()) {
      errors.companyName = "Company name is required";
    } else if (formData.companyName.trim().length < 2) {
      errors.companyName = "Company name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Work email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid work email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
        formData.password
      )
    ) {
      errors.password =
        "Password must contain uppercase, lowercase, number, and special character";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = "You must accept the terms of service";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        companyName: formData.companyName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: Record<string, string[]> };
      if (errorObj?.errors) {
        const mappedErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(errorObj.errors)) {
          if (msgs && msgs[0]) mappedErrors[key] = msgs[0];
        }
        setFieldErrors(mappedErrors);
      }
      setErrorMessage(
        errorObj?.message || "Failed to create account. Please check your details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create workspace"
      subtitle="Register your company and initialize your OWNER account"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {errorMessage && (
          <AuthAlert
            type="error"
            message={errorMessage}
            onClose={() => setErrorMessage("")}
          />
        )}

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#fff0e8] border border-[#eadbd2] text-xs text-[#77716e] text-left">
          <Info className="w-4 h-4 text-[#f47b5b] shrink-0 mt-0.5" />
          <span>
            Public registration initializes your company and grants your account the initial{" "}
            <strong className="text-[#252525]">OWNER</strong> role.
          </span>
        </div>

        <AuthInput
          label="Your Full Name"
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Tanishka Dhaybar"
          required
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
          }}
          error={fieldErrors.name}
          icon={<User className="w-4 h-4" />}
        />

        <AuthInput
          label="Company Name"
          id="company-name"
          name="organization"
          type="text"
          autoComplete="organization"
          placeholder="Oppidan India Group"
          required
          value={formData.companyName}
          onChange={(e) => {
            setFormData({ ...formData, companyName: e.target.value });
            if (fieldErrors.companyName)
              setFieldErrors((prev) => ({ ...prev, companyName: "" }));
          }}
          error={fieldErrors.companyName}
          icon={<Building className="w-4 h-4" />}
        />

        <AuthInput
          label="Work Email"
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          spellCheck={false}
          placeholder="owner@company.com"
          required
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
          }}
          error={fieldErrors.email}
          icon={<Mail className="w-4 h-4" />}
        />

        <PasswordInput
          label="Password"
          id="new-password"
          name="new-password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
          }}
          error={fieldErrors.password}
        />

        <PasswordStrength password={formData.password} />

        <PasswordInput
          label="Confirm Password"
          id="confirm-password"
          name="confirm-password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          required
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (fieldErrors.confirmPassword)
              setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          error={fieldErrors.confirmPassword}
        />

        {/* Terms Acceptance */}
        <div className="pt-1 text-left">
          <label className="flex items-start gap-2.5 text-xs text-[#77716e] cursor-pointer">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => {
                setFormData({ ...formData, acceptTerms: e.target.checked });
                if (fieldErrors.acceptTerms)
                  setFieldErrors((prev) => ({ ...prev, acceptTerms: "" }));
              }}
              className="mt-0.5 w-4 h-4 rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]/30 accent-[#f47b5b] cursor-pointer"
            />
            <span>
              I agree to the{" "}
              <span className="text-[#252525] font-semibold underline underline-offset-2">
                Enterprise Terms of Service
              </span>{" "}
              and data protection policies.
            </span>
          </label>
          {fieldErrors.acceptTerms && (
            <p className="text-xs text-[#c74747] font-medium pt-1">
              {fieldErrors.acceptTerms}
            </p>
          )}
        </div>

        <div className="pt-2">
          <AuthButton isLoading={isLoading}>
            <span>Create Workspace Account</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </AuthButton>
        </div>

        <div className="pt-3 border-t border-[#eadbd2]/60 text-center text-xs text-[#77716e]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#f47b5b] font-semibold hover:text-[#e96849] transition-colors"
          >
            Sign in here
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
