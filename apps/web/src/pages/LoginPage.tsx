import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { PasswordInput } from "../components/auth/PasswordInput";
import { AuthButton } from "../components/auth/AuthButton";
import { AuthAlert } from "../components/auth/AuthAlert";
import { useAuth } from "../hooks/useAuth";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = "Work email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
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
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      // Redirect to target path or dashboard
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: Record<string, string[]> };
      if (errorObj?.errors) {
        const mappedErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(errorObj.errors)) {
          if (msgs && msgs[0]) mappedErrors[key] = msgs[0];
        }
        setFieldErrors(mappedErrors);
      }
      setErrorMessage(errorObj?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Oppidan ERMS workspace"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errorMessage && (
          <AuthAlert
            type="error"
            message={errorMessage}
            onClose={() => setErrorMessage("")}
          />
        )}

        <AuthInput
          label="Work Email"
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          spellCheck={false}
          placeholder="name@company.com"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
          }}
          error={fieldErrors.email}
          icon={<Mail className="w-4 h-4" />}
        />

        <div className="space-y-1">
          <PasswordInput
            label="Password"
            id="current-password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            error={fieldErrors.password}
          />

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 text-[#77716e] cursor-pointer hover:text-[#252525]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#eadbd2] text-[#f47b5b] focus:ring-[#f47b5b]/30 accent-[#f47b5b] cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => alert("Password reset functionality will be sent to your verified work email address.")}
              className="text-[#f47b5b] hover:text-[#e96849] font-medium transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <div className="pt-2">
          <AuthButton isLoading={isLoading}>
            <span>Sign in to Workspace</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </AuthButton>
        </div>

        <div className="pt-4 border-t border-[#eadbd2]/60 text-center text-xs text-[#77716e]">
          Don't have a workspace?{" "}
          <Link
            to="/register"
            className="text-[#f47b5b] font-semibold hover:text-[#e96849] transition-colors"
          >
            Register your company
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
