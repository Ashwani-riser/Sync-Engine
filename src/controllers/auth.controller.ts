import { Request, Response } from "express";
import {
    registerUser,
    loginUser,
    getUserById,
} from "../services/auth.service";

import { AuthRequest } from "../middleware/auth.middleware";

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

        const user = await registerUser({
            name,
            email,
            password,
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
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
            email,
            password,
        });

        // Store JWT in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
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
            message: error.message,
        });
    }
};

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
            message: error.message,
        });
    }
};