import { Router } from "express";

import {
    register,
    login,
    getMe,
    googleLogin,
     verifyEmail,
     getSocketToken,
} from "../controllers/auth.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/verify-email", verifyEmail);
router.get(
    "/socket-token",
    authenticate,
    getSocketToken
);
// Protected route
router.get("/me", authenticate, getMe);

export default router;