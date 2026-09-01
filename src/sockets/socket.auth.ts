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
}

const getTokenFromCookie = (cookieHeader: string) => {
    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
        const [name, ...value] = cookie.trim().split("=");

        if (name === "token") {
            return decodeURIComponent(value.join("="));
        }
    }

    return null;
};

export const authenticateSocket = (
    socket: AuthSocket,
    next: (err?: Error) => void
) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie;

        if (!cookieHeader) {
            return next(
                new Error("Authentication required")
            );
        }

        const token = getTokenFromCookie(cookieHeader); //JWT nikalta hai.

        if (!token) {
            return next(
                new Error("Authentication token missing")
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
        next(
            new Error("Invalid or expired token")
        );
    }
};