import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Public routes with brute-force rate limiting
router.post("/register", authRateLimiter, AuthController.register);
router.post("/login", authRateLimiter, AuthController.login);

// Session management
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

// Protected current user profile
router.get("/me", authenticate, AuthController.me);

export default router;
