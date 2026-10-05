import { Request, Response } from "express";

import {
    loginUser,
    getUserById,
} from "../services/auth.service";

import { AuthRequest } from "../middleware/auth.middleware";
import { loginWithGoogle } from "../services/google-auth.service";

import {
    createPendingVerification,
    verifyPendingUser,
} from "../services/email-verification.service";

import {
    sendVerificationEmail,
} from "../services/email.service";


// ================= REGISTER =================

export const register = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Create pending user instead of actual User
        const { token } = await createPendingVerification({
            name,
            email: normalizedEmail,
            password,
        });

        // Send verification email
        await sendVerificationEmail(
            normalizedEmail,
            name,
            token
        );

        res.status(201).json({
            success: true,
            message:
                "Registration started. Please check your email and verify your account.",
        });

    } catch (error: any) {
        console.error("Registration error:", error);

        res.status(400).json({
            success: false,
            message: error.message || "Registration failed",
        });
    }
};


// ================= LOGIN =================

export const login = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
            return;
        }

        const { user, token } = await loginUser({
            email: email.toLowerCase().trim(),
            password,
        });

        // Block unverified email accounts
        if (!user.emailVerified) {
            res.status(403).json({
                success: false,
                message:
                    "Please verify your email before logging in.",
            });
            return;
        }

        // Store JWT in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error: any) {
        res.status(401).json({
            success: false,
            message: error.message || "Login failed",
        });
    }
};


// ================= GET ME =================

export const getMe = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        const user = await getUserById(userId);

        res.status(200).json({
            success: true,
            user,
        });

    } catch (error: any) {
        res.status(404).json({
            success: false,
            message: error.message || "User not found",
        });
    }
};


// ================= GOOGLE LOGIN =================

export const googleLogin = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { credential } = req.body;

        if (!credential) {
            res.status(400).json({
                success: false,
                message: "Google credential is required",
            });
            return;
        }

        const result = await loginWithGoogle(credential);

        res.cookie("token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        console.log("NODE_ENV:", process.env.NODE_ENV);
       console.log("CLIENT_URL:", process.env.CLIENT_URL);
       console.log("Google JWT created:", !!result.token);

        res.status(200).json({
            success: true,
            message: "Google login successful",
            user: result.user,
        });

    } catch (error) {
        console.error("Google login error:", error);

        res.status(401).json({
            success: false,
            message: "Google authentication failed",
        });
    }
};


// ================= VERIFY EMAIL =================

export const verifyEmail = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== "string") {
            res.status(400).json({
                success: false,
                message: "Verification token is required",
            });
            return;
        }

        // Convert PendingUser → actual User
        const user = await verifyPendingUser(token);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error: any) {
        console.error("Email verification error:", error);

        res.status(400).json({
            success: false,
            message:
                error.message || "Email verification failed",
        });
    }
};