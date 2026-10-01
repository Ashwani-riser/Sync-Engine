import { Server } from "socket.io";
import { AuthSocket } from "./socket.auth";

const documentUsers = new Map<string, Set<string>>();

export const addUserToDocument = (
    documentId: string,
    userId: string
) => {
    if (!documentUsers.has(documentId)) {
        documentUsers.set(documentId, new Set());
    }

    documentUsers.get(documentId)!.add(userId);
};

export const removeUserFromDocument = (
    documentId: string,
    userId: string
) => {
    const users = documentUsers.get(documentId);

    if (!users) return;

    users.delete(userId);

    if (users.size === 0) {
        documentUsers.delete(documentId);
    }
};

export const getDocumentUsers = (documentId: string) => {
    return Array.from(documentUsers.get(documentId) || []);
};

export const broadcastPresence = (
    io: Server,
    documentId: string
) => {
    io.to(`document:${documentId}`).emit(
        "presence-updated",
        {
            documentId,
            users: getDocumentUsers(documentId),
        }
    );
};