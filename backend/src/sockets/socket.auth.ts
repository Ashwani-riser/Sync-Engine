import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface JwtPayload {
    userId: string;
    email: string;
}

export interface AuthSocket extends Socket {
    user?: {
        userId: string;
        email: string;
    };

    joinedDocumentId?: string;
}

export const authenticateSocket = (
    socket: AuthSocket,
    next: (err?: Error) => void
) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(
                new Error("Socket authentication token missing")
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as JwtPayload;

        socket.user = {
            userId: decoded.userId,
            email: decoded.email,
        };

        next();

    } catch (error) {
        console.error(
            "❌ Socket authentication failed:",
            error
        );

        next(
            new Error("Invalid or expired socket token")
        );
    }
};