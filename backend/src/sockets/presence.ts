import { Server } from "socket.io";
import User from "../models/user";

const documentUsers = new Map<string, Set<string>>();

// ==========================================
// ADD USER TO DOCUMENT
// ==========================================

export const addUserToDocument = (
    documentId: string,
    userId: string
) => {
    if (!documentUsers.has(documentId)) {
        documentUsers.set(
            documentId,
            new Set()
        );
    }

    documentUsers
        .get(documentId)!
        .add(userId);
};

// ==========================================
// REMOVE USER FROM DOCUMENT
// ==========================================

export const removeUserFromDocument = (
    documentId: string,
    userId: string
) => {
    const users =
        documentUsers.get(documentId);

    if (!users) return;

    users.delete(userId);

    if (users.size === 0) {
        documentUsers.delete(documentId);
    }
};

// ==========================================
// GET USERS IN DOCUMENT
// ==========================================

export const getDocumentUsers = (
    documentId: string
) => {
    return Array.from(
        documentUsers.get(documentId) || []
    );
};

// ==========================================
// BROADCAST PRESENCE
// ==========================================

export const broadcastPresence = async (
    io: Server,
    documentId: string
) => {
    try {
        const userIds =
            getDocumentUsers(documentId);

        const users = await User.find({
            _id: {
                $in: userIds,
            },
        }).select("_id name email");

        const presenceUsers = users.map(
            (user) => ({
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
            })
        );

        io.to(
            `document:${documentId}`
        ).emit(
            "presence-updated",
            {
                documentId,
                users: presenceUsers,
            }
        );

    } catch (error) {
        console.error(
            "Presence broadcast error:",
            error
        );
    }
};