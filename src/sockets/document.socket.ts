import { Server } from "socket.io";
import { AuthSocket } from "./socket.auth";
import { getUserRole } from "../services/permission.service";
import { updateDocument } from "../services/document.service";

export const registerDocumentSocket = (
    io: Server,
    socket: AuthSocket
) => {

    // JOIN DOCUMENT ROOM
    socket.on("join-document", async (documentId: string) => {
        try {
            const user = socket.user;

            // Check authentication
            if (!user) {
                socket.emit("socket-error", {
                    message: "Unauthorized",
                });
                return;
            }

            // Check user's access to document
            const role = await getUserRole(
                documentId,
                user.userId
            );

            // No access
            if (!role) {
                socket.emit("socket-error", {
                    message: "You don't have access to this document",
                });
                return;
            }

            // Create room name
            const room = `document:${documentId}`;

            // Join room
            await socket.join(room);

            console.log(
                `👤 ${user.email} joined ${room} as ${role}`
            );

            // Tell client that joining was successful
            socket.emit("document-joined", {
                documentId,
                role,
                message: "Joined document successfully",
            });

        } catch (error) {
            console.error(
                "Join document error:",
                error
            );

            socket.emit("socket-error", {
                message: "Failed to join document",
            });
        }
    });

   //UPDATE DOCUMENT

    socket.on("document-update", async (data) => {
        try {
            const user = socket.user;

            // Check authentication
            if (!user) {
                socket.emit("socket-error", {
                    message: "Unauthorized",
                });
                return;
            }

            const {
                documentId,
                title,
                content,
            } = data;

            // Validate document ID
            if (!documentId) {
                socket.emit("socket-error", {
                    message: "Document ID is required",
                });
                return;
            }

            // Check user's role
            const role = await getUserRole(
                documentId,
                user.userId
            );

            // Only owner and editor can edit
            if (
                role !== "owner" &&
                role !== "editor"
            ) {
                socket.emit("socket-error", {
                    message:
                        "You don't have permission to edit this document",
                });
                return;
            }

            //save update to mongodb

            const updatedDocument = await updateDocument(
                documentId,
                user.userId,
                title,
                content
            );

            //Broadcast to Room

            const room = `document:${documentId}`;

            io.to(room).emit("document-updated", {
                documentId,
                title: updatedDocument.title,
                content: updatedDocument.content,
                updatedBy: user.userId,
            });

            console.log(
                `📝 ${user.email} updated document ${documentId}`
            );

        } catch (error) {
            console.error(
                "Document update error:",
                error
            );

            socket.emit("socket-error", {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to update document",
            });
        }
    });
};