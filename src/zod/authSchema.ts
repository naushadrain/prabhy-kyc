// src/zod/authSchema.ts
import { z } from "zod";

export const loginSchema = z.object({
    mobile: z
        .string()
        .min(10, "Mobile number must be 10 digits")
        .max(10, "Mobile number must be 10 digits")
        .regex(/^[0-9]+$/, "Only numbers allowed"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(12, "Password must be at most 20 characters")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

