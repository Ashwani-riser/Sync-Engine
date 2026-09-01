import { Server } from "socket.io";
import { AuthSocket } from "./socket.auth";
import { getUserRole } from "../services/permission.service";

export const registerDocumentSocket = (
    io: Server,
    socket: AuthSocket
) => {

    socket.on("document-update", async (data) => {
    try {
        const userId = socket.user?.userId;

        if (!userId) {
            socket.emit("socket-error", {
                message: "Unauthorized",
            });
            return;
        }

        const { documentId, title, content } = data;

        const role = await getUserRole(documentId, userId);

        if (role !== "owner" && role !== "editor") {
            socket.emit("socket-error", {
                message: "You don't have permission to edit this document",
            });
            return;
        }

        const room = `document:${documentId}`;

        io.to(room).emit("document-updated", {
            documentId,
            title,
            content,
            updatedBy: userId,
        });

    } catch (error) {
        console.error("Document update error:", error);

        socket.emit("socket-error", {
            message: "Failed to update document",
        });
    }
  });
};