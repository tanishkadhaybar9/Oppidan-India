import { z } from "zod";
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
export const registerSchema = z
    .object({
    name: z
        .string()
        .min(1, "Full name is required")
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100, "Full name must not exceed 100 characters"),
    companyName: z
        .string()
        .min(1, "Company name is required")
        .trim()
        .min(2, "Company name must be at least 2 characters")
        .max(100, "Company name must not exceed 100 characters"),
    email: z
        .string()
        .min(1, "Email is required")
        .trim()
        .toLowerCase()
        .email("Please provide a valid work email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must not exceed 100 characters")
        .regex(passwordRegex, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address"),
    password: z.string().min(1, "Password is required"),
});
//# sourceMappingURL=auth.validation.js.map