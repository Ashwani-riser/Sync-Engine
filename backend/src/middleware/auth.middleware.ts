import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

interface JwtPayload {
    userId: string;
    email: string;
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const token =
            req.cookies?.token ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Authentication token is required",
            });
            return;
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as JwtPayload;

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };

        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};